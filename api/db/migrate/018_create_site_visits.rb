# frozen_string_literal: true

require_relative '../../app/helpers/database'

Database.with_open_conn do |conn|
  conn.exec <<~SQL
    CREATE TABLE IF NOT EXISTS site_visits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      visited_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ip_address VARCHAR(45),
      user_agent TEXT
    );
  SQL
  conn.close
end
