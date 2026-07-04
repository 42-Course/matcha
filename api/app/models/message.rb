# frozen_string_literal: true

require_relative '../helpers/database'

class Message
  def self.create(connection_id, sender_id, content)
    Database.with_conn do |conn|
      res = conn.exec_params(<<~SQL, [connection_id, sender_id, content])
        INSERT INTO messages (connection_id, sender_id, content, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      SQL
      res&.first
    end
  end

  # True if `sender_id` has already sent a message in this connection today.
  # Backs the "one message per conversation per calendar day" rule. Uses the
  # database clock (CURRENT_DATE) so the boundary is consistent regardless of
  # which app machine handles the request.
  def self.sent_today?(connection_id, sender_id)
    Database.with_conn do |conn|
      res = conn.exec_params(<<~SQL, [connection_id, sender_id])
        SELECT 1 FROM messages
        WHERE connection_id = $1
          AND sender_id = $2
          AND created_at::date = CURRENT_DATE
        LIMIT 1
      SQL
      !res.first.nil?
    end
  end

  def self.for_connection(connection_id)
    Database.with_conn do |conn|
      res = conn.exec_params(<<~SQL, [connection_id])
        SELECT messages.*, users.username AS sender_username
        FROM messages
        JOIN users ON users.id = messages.sender_id
        WHERE messages.connection_id = $1
        ORDER BY messages.created_at ASC
      SQL
      res.to_a
    end
  end

  def self.count
    Database.with_conn do |conn|
      res = conn.exec('SELECT COUNT(*) FROM messages')
      res.first['count'].to_i
    end
  end

  def self.messages_over_time(days = nil)
    where_clause = days ? "WHERE created_at >= NOW() - INTERVAL '#{days.to_i} days'" : ''
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM messages
        #{where_clause}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      SQL
      res = conn.exec(sql)
      res.to_a
    end
  end
end
