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

  def self.count_by_user(limit = 100)
    Database.with_conn do |conn|
      # Aggregate site_visits once (uses the user_id index) and join the small
      # result to users, rather than expanding every visit row before grouping.
      sql = <<~SQL
        SELECT users.id, users.username, counts.visit_count
        FROM (
          SELECT user_id, COUNT(*) AS visit_count
          FROM site_visits
          GROUP BY user_id
          ORDER BY visit_count DESC
          LIMIT $1
        ) counts
        JOIN users ON users.id = counts.user_id
        ORDER BY counts.visit_count DESC
      SQL
      res = conn.exec_params(sql, [limit])
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
      # Pull the most recent visits straight off the visited_at index (cheap,
      # bounded), then dedupe by user instead of aggregating the whole table.
      sql = <<~SQL
        SELECT username, visited_at, city, country
        FROM (
          SELECT DISTINCT ON (recent.user_id)
                 recent.user_id, recent.visited_at,
                 users.username, users.city, users.country
          FROM (
            SELECT user_id, visited_at
            FROM site_visits
            ORDER BY visited_at DESC
            LIMIT 1000
          ) recent
          JOIN users ON users.id = recent.user_id
          ORDER BY recent.user_id, recent.visited_at DESC
        ) latest
        ORDER BY visited_at DESC
        LIMIT $1
      SQL
      res = conn.exec_params(sql, [limit])
      res.to_a
    end
  end

  def self.visits_over_time(_days = nil)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT DATE(visited_at) as date, COUNT(*) as count
        FROM site_visits
        GROUP BY DATE(visited_at)
        ORDER BY date ASC
      SQL
      res = conn.exec(sql)
      res.to_a
    end
  end
end
