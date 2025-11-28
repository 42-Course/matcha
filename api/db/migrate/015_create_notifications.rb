# frozen_string_literal: true

require_relative '../../app/helpers/database'

Database.with_open_conn do |conn|
  conn.exec <<~SQL
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK (type IN ('like', 'unlike', 'view', 'message', 'video_call', 'match', 'date', 'announcement', 'connection', 'other')),
      message TEXT NOT NULL,
      target_id TEXT,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  SQL
end
