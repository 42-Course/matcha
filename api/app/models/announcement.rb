# frozen_string_literal: true

require_relative '../helpers/database'

class Announcement
  def self.create(title, content, created_by, expires_at = nil)
    Database.with_conn do |conn|
      sql = <<~SQL
        INSERT INTO announcements (title, content, created_by, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      SQL
      res = conn.exec_params(sql, [title, content, created_by, expires_at])
      res.first
    end
  end

  def self.all_active
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT announcements.*, users.username as created_by_username
        FROM announcements
        JOIN users ON users.id = announcements.created_by
        WHERE is_active = TRUE
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
      SQL
      res = conn.exec(sql)
      res.to_a
    end
  end

  def self.all
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT announcements.*, users.username as created_by_username
        FROM announcements
        JOIN users ON users.id = announcements.created_by
        ORDER BY created_at DESC
      SQL
      res = conn.exec(sql)
      res.to_a
    end
  end

  def self.find_by_id(id)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT announcements.*, users.username as created_by_username
        FROM announcements
        JOIN users ON users.id = announcements.created_by
        WHERE announcements.id = $1
      SQL
      res = conn.exec_params(sql, [id])
      res.first
    end
  end

  def self.deactivate(id)
    Database.with_conn do |conn|
      sql = 'UPDATE announcements SET is_active = FALSE WHERE id = $1'
      conn.exec_params(sql, [id])
    end
  end

  def self.delete(id)
    Database.with_conn do |conn|
      sql = 'DELETE FROM announcements WHERE id = $1'
      conn.exec_params(sql, [id])
    end
  end
end
