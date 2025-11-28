# frozen_string_literal: true

require_relative '../helpers/database'

class UserSession
  def self.start_session(user_id, ip_address = nil, user_agent = nil)
    Database.with_conn do |conn|
      sql = <<~SQL
        INSERT INTO user_sessions (user_id, started_at, ip_address, user_agent)
        VALUES ($1, NOW(), $2, $3)
        RETURNING id
      SQL
      res = conn.exec_params(sql, [user_id, ip_address, user_agent])
      res.first['id']
    end
  end

  def self.end_session(session_id)
    Database.with_conn do |conn|
      sql = <<~SQL
        UPDATE user_sessions
        SET ended_at = NOW(),
            duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
        WHERE id = $1 AND ended_at IS NULL
      SQL
      conn.exec_params(sql, [session_id])
    end
  end

  def self.get_active_session(user_id)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT id FROM user_sessions
        WHERE user_id = $1 AND ended_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1
      SQL
      res = conn.exec_params(sql, [user_id])
      res.first
    end
  end

  def self.total_activity_minutes(user_id)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
        FROM user_sessions
        WHERE user_id = $1 AND duration_minutes IS NOT NULL
      SQL
      res = conn.exec_params(sql, [user_id])
      res.first['total_minutes'].to_f.round
    end
  end

  def self.sessions_over_time(days = 30)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT DATE(started_at) as date, COUNT(*) as count
        FROM user_sessions
        WHERE started_at >= NOW() - INTERVAL '#{days} days'
        GROUP BY DATE(started_at)
        ORDER BY date ASC
      SQL
      res = conn.exec(sql)
      res.to_a
    end
  end
end
