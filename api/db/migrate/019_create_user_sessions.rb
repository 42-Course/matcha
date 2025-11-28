# frozen_string_literal: true

require_relative '../../app/helpers/database'

Database.with_open_conn do |conn|
  conn.exec <<~SQL
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      started_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMP,
      duration_minutes INTEGER,
      ip_address VARCHAR(45),
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);
  SQL
  conn.close
end
