# frozen_string_literal: true

require_relative '../helpers/database'

class SiteVisit
  def self.record(user_id, ip_address = nil, user_agent = nil)
    Database.with_conn do |conn|
      sql = <<~SQL
        INSERT INTO site_visits (user_id, visited_at, ip_address, user_agent)
        VALUES ($1, NOW(), $2, $3)
      SQL
      conn.exec_params(sql, [user_id, ip_address, user_agent])
    end
  end

  def self.all
    Database.with_conn do |conn|
      res = conn.exec('SELECT * FROM site_visits ORDER BY visited_at DESC')
      res.to_a
    end
  end

  def self.count_by_user
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT users.id, users.username, COUNT(site_visits.id) as visit_count
        FROM users
        LEFT JOIN site_visits ON site_visits.user_id = users.id
        GROUP BY users.id, users.username
        ORDER BY visit_count DESC
      SQL
      res = conn.exec(sql)
      res.to_a
    end
  end

  def self.recent(limit = 100)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT site_visits.*, users.username
        FROM site_visits
        JOIN users ON users.id = site_visits.user_id
        ORDER BY visited_at DESC
        LIMIT $1
      SQL
      res = conn.exec_params(sql, [limit])
      res.to_a
    end
  end

  def self.recent_with_location(limit = 5)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT DISTINCT ON (users.id)
          users.username,
          site_visits.visited_at,
          users.city,
          users.country
        FROM site_visits
        JOIN users ON users.id = site_visits.user_id
        ORDER BY users.id, site_visits.visited_at DESC
        LIMIT $1
      SQL
      res = conn.exec_params(sql, [limit])
      res.to_a
    end
  end

  def self.visits_over_time(days = 30)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT DATE(visited_at) as date, COUNT(*) as count
        FROM site_visits
        WHERE visited_at >= NOW() - INTERVAL '#{days} days'
        GROUP BY DATE(visited_at)
        ORDER BY date ASC
      SQL
      res = conn.exec(sql)
      res.to_a
    end
  end
end
