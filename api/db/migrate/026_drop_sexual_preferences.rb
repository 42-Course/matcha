# frozen_string_literal: true

require_relative '../../app/helpers/database'

# Matcha is a friends app, not a dating app: drop the sexual_preferences column
# (and its CHECK constraint, which is removed automatically with the column).
Database.with_open_conn do |conn|
  conn.exec 'ALTER TABLE users DROP COLUMN IF EXISTS sexual_preferences'
end
