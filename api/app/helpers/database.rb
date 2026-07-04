# frozen_string_literal: true

require 'pg'
require 'uri'
require 'connection_pool'

module Database
  # Keep the pool small: every Fly machine keeps its own pool, and they all
  # share the Postgres `max_connections` budget. Oversizing it is what makes the
  # server start refusing new connections ("SSL SYSCALL error: EOF detected").
  POOL_SIZE = (ENV['DB_POOL_SIZE'] || 10).to_i
  POOL_TIMEOUT = (ENV['DB_POOL_TIMEOUT'] || 5).to_i

  def self.connection_params
    uri = URI.parse(ENV['DATABASE_URL'])
    {
      host: uri.host,
      port: uri.port,
      user: uri.user,
      password: uri.password,
      dbname: uri.path[1..],
      # Fail fast instead of hanging the request when the DB is unreachable.
      connect_timeout: 5,
      # Let libpq notice a dropped socket rather than discovering it mid-query.
      keepalives: 1,
      keepalives_idle: 30,
      keepalives_interval: 10,
      keepalives_count: 3
    }
  end

  def self.new_connection
    PG.connect(connection_params)
  end

  def self.pool
    @pool ||= ConnectionPool.new(size: POOL_SIZE, timeout: POOL_TIMEOUT) do
      new_connection
    end
  end

  # Heals a single pooled connection in place instead of throwing away the whole
  # pool. A connection the server closed (idle timeout, restart, failover) still
  # reports as "open" locally, so we can't trust conn.finished? alone — when the
  # first real query blows up we reset just that connection and retry.
  def self.with_conn(max_retries: 2)
    pool.with do |conn|
      attempts = 0
      begin
        reconnect!(conn) if attempts.positive? || dead?(conn)
        yield conn
      rescue PG::ConnectionBad, PG::UnableToSend => e
        attempts += 1
        raise if attempts > max_retries

        puts "[DB] healing connection after: #{e.message} (attempt #{attempts}/#{max_retries})"
        sleep(0.2 * attempts)
        retry
      end
    end
  end

  def self.dead?(conn)
    conn.finished? || conn.status != PG::CONNECTION_OK
  end

  def self.reconnect!(conn)
    conn.reset
  rescue PG::Error => e
    # Swallow here; the surrounding retry loop will try the query again and
    # surface a real failure once max_retries is exhausted.
    puts "[DB] reset failed: #{e.message}"
  end

  # Dedicated pool for migrations / setup scripts. Memoized so we don't leak a
  # fresh pool (and its connections) on every call.
  def self.open_pool
    @open_pool ||= ConnectionPool.new(size: 3, timeout: POOL_TIMEOUT) do
      new_connection
    end
  end

  def self.with_open_conn(&block)
    open_pool.with do |conn|
      # Migration/setup scripts routinely call conn.close inside their block,
      # which leaves a closed connection in this pool for the next caller to
      # pick up. Heal it on checkout so a run of migrations can't abort halfway.
      reconnect!(conn) if dead?(conn)
      block.call(conn)
    end
  end
end
