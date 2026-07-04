# frozen_string_literal: true

require_relative '../../app/helpers/database'

Database.with_open_conn do |conn|
  conn.exec <<~SQL
    CREATE TABLE IF NOT EXISTS events (
      id           SERIAL PRIMARY KEY,
      host_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title        VARCHAR(255) NOT NULL,
      description  TEXT,
      location     VARCHAR(255),
      latitude     DOUBLE PRECISION,
      longitude    DOUBLE PRECISION,
      starts_at    TIMESTAMP NOT NULL,
      ends_at      TIMESTAMP,
      capacity     INTEGER,
      is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_events_host_id   ON events(host_id);
    CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);

    CREATE TABLE IF NOT EXISTS event_attendances (
      id         SERIAL PRIMARY KEY,
      event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status     VARCHAR(20) NOT NULL DEFAULT 'going',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (event_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_event_attendances_event_id ON event_attendances(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_attendances_user_id  ON event_attendances(user_id);
  SQL
  conn.close
end
