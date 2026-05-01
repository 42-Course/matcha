# frozen_string_literal: true

require_relative '../../app/helpers/database'

INDEXES = [
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_visits_visited_at ON site_visits(visited_at DESC)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_visits_user_id_visited_at ON site_visits(user_id, visited_at DESC)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_visited_at ON profile_views(visited_at DESC)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id, visited_at DESC)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_viewed_id ON profile_views(viewed_id, visited_at DESC)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_connection_id_created_at ON messages(connection_id, created_at)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dates_created_at ON dates(created_at DESC)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dates_initiator_id ON dates(initiator_id)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dates_connection_id ON dates(connection_id)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_liked_id_liker_id ON likes(liked_id, liker_id)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_user_a_id ON connections(user_a_id)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_user_b_id ON connections(user_b_id)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_to_user_id_created_at ON notifications(to_user_id, created_at DESC)',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_online_status ON users(online_status) WHERE online_status = TRUE'
].freeze

INDEXES.each do |sql|
  Database.with_open_conn do |conn|
    puts "  → #{sql.split(' ON ').first.sub('CREATE INDEX CONCURRENTLY IF NOT EXISTS ', '')}"
    conn.exec(sql)
  rescue PG::Error => e
    puts "  ⚠️  #{e.message.strip}"
  end
end
