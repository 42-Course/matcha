# frozen_string_literal: true

require_relative '../../app/helpers/database'

Database.with_open_conn do |conn|
  conn.exec <<~SQL
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS background_type VARCHAR(50) DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS background_url TEXT;
  SQL
  conn.close
end
