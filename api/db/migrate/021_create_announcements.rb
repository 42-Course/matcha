# frozen_string_literal: true

require_relative '../../app/helpers/database'

Database.with_open_conn do |conn|
  conn.exec <<~SQL
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    );

    CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
    CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
  SQL
  conn.close
end
