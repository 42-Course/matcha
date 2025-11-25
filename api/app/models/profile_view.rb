# frozen_string_literal: true

require_relative '../helpers/database'

class ProfileView
  def self.record(viewer_id, viewed_id)
    return if viewer_id == viewed_id

    Database.with_conn do |conn|
      conn.exec_params(<<~SQL, [viewer_id, viewed_id])
        INSERT INTO profile_views (viewer_id, viewed_id, visited_at)
        VALUES ($1, $2, NOW())
      SQL
    end
    User.update_fame!(viewed_id)
  end

  def self.visited(user_id)
    Database.with_conn do |conn|
      res = conn.exec_params(<<~SQL, [user_id]).to_a
        SELECT users.*, profile_views.visited_at FROM users
        JOIN profile_views ON profile_views.viewed_id = users.id
        WHERE profile_views.viewer_id = $1
        ORDER BY profile_views.visited_at DESC
      SQL
      res.map { |user| UserSerializer.public_view(user) }
    end
  end

  def self.views(user_id)
    Database.with_conn do |conn|
      res = conn.exec_params(<<~SQL, [user_id]).to_a
        SELECT users.*, profile_views.visited_at FROM users
        JOIN profile_views ON profile_views.viewer_id = users.id
        WHERE profile_views.viewed_id = $1
        ORDER BY profile_views.visited_at DESC
      SQL
      res.map { |user| UserSerializer.public_view(user) }
    end
  end

  def self.views_over_time(days = 30)
    Database.with_conn do |conn|
      sql = <<~SQL
        SELECT DATE(visited_at) as date, COUNT(*) as count
        FROM profile_views
        WHERE visited_at >= NOW() - INTERVAL '#{days} days'
        GROUP BY DATE(visited_at)
        ORDER BY date ASC
      SQL
      res = conn.exec(sql)
      res.to_a
    end
  end
end
