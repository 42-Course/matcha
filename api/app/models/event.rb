# frozen_string_literal: true

require_relative '../helpers/database'
require_relative '../helpers/sql_helper'

class Event
  ATTENDANCE_STATUSES = %w[going interested].freeze

  def self.db
    Database.pool
  end

  # ---------------------------
  # QUERIES
  # ---------------------------

  # Base SELECT that decorates an event with host info and attendee counts.
  SELECT_WITH_META = <<~SQL
    SELECT
      events.*,
      users.username   AS host_username,
      users.first_name AS host_first_name,
      users.last_name  AS host_last_name,
      COALESCE(going.count, 0)      AS going_count,
      COALESCE(interested.count, 0) AS interested_count
    FROM events
    JOIN users ON users.id = events.host_id
    LEFT JOIN (
      SELECT event_id, COUNT(*) AS count
      FROM event_attendances WHERE status = 'going' GROUP BY event_id
    ) going ON going.event_id = events.id
    LEFT JOIN (
      SELECT event_id, COUNT(*) AS count
      FROM event_attendances WHERE status = 'interested' GROUP BY event_id
    ) interested ON interested.event_id = events.id
  SQL

  # Upcoming, non-cancelled events ordered by soonest first.
  def self.upcoming
    db.with do |conn|
      conn.exec(<<~SQL).to_a
        #{SELECT_WITH_META}
        WHERE events.is_cancelled = FALSE
          AND events.starts_at >= NOW()
        ORDER BY events.starts_at ASC
      SQL
    end
  end

  def self.find_with_meta(id)
    db.with do |conn|
      conn.exec_params("#{SELECT_WITH_META} WHERE events.id = $1", [id]).to_a.first
    end
  end

  # Raw row (no meta) — used for ownership checks.
  def self.find_by_id(id)
    db.with do |conn|
      conn.exec_params('SELECT * FROM events WHERE id = $1', [id]).to_a.first
    end
  end

  # Events a user hosts or is attending.
  def self.for_user(user_id)
    db.with do |conn|
      conn.exec_params(<<~SQL, [user_id]).to_a
        #{SELECT_WITH_META}
        WHERE events.host_id = $1
           OR events.id IN (SELECT event_id FROM event_attendances WHERE user_id = $1)
        ORDER BY events.starts_at ASC
      SQL
    end
  end

  def self.attendees(event_id)
    db.with do |conn|
      conn.exec_params(<<~SQL, [event_id]).to_a
        SELECT users.id, users.username, users.first_name, users.last_name,
               event_attendances.status, event_attendances.created_at
        FROM event_attendances
        JOIN users ON users.id = event_attendances.user_id
        WHERE event_attendances.event_id = $1
        ORDER BY event_attendances.created_at ASC
      SQL
    end
  end

  # ---------------------------
  # MUTATIONS
  # ---------------------------

  def self.create(host_id, attrs)
    values = [
      host_id, attrs['title'], attrs['description'], attrs['location'],
      attrs['latitude'], attrs['longitude'], attrs['starts_at'],
      attrs['ends_at'], attrs['capacity']
    ]
    db.with do |conn|
      conn.exec_params(<<~SQL, values).to_a.first
        INSERT INTO events
          (host_id, title, description, location, latitude, longitude,
           starts_at, ends_at, capacity, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      SQL
    end
  end

  UPDATABLE_FIELDS = %w[title description location latitude longitude
                        starts_at ends_at capacity is_cancelled].freeze

  def self.update(id, fields)
    SQLHelper.update(:events, id, fields, UPDATABLE_FIELDS)
  end

  def self.delete(id)
    db.with { |conn| conn.exec_params('DELETE FROM events WHERE id = $1', [id]) }
  end

  # ---------------------------
  # ATTENDANCE
  # ---------------------------

  # Upsert an RSVP for (event, user). Returns the attendance row.
  def self.rsvp(event_id, user_id, status)
    db.with do |conn|
      conn.exec_params(<<~SQL, [event_id, user_id, status]).to_a.first
        INSERT INTO event_attendances (event_id, user_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
        RETURNING *
      SQL
    end
  end

  def self.cancel_rsvp(event_id, user_id)
    db.with do |conn|
      conn.exec_params(
        'DELETE FROM event_attendances WHERE event_id = $1 AND user_id = $2',
        [event_id, user_id]
      ).cmd_tuples
    end
  end

  def self.going_count(event_id)
    db.with do |conn|
      res = conn.exec_params(
        "SELECT COUNT(*) FROM event_attendances WHERE event_id = $1 AND status = 'going'",
        [event_id]
      )
      res.first['count'].to_i
    end
  end
end
