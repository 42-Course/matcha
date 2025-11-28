# frozen_string_literal: true

require_relative './base_controller'
require_relative '../models/site_visit'
require_relative '../models/message'
require_relative '../models/date'
require_relative '../models/like'
require_relative '../models/announcement'
require_relative '../models/notification'

class AdminController < BaseController
  before do
    next if request.request_method == 'OPTIONS'
    next if request.path_info == '/admin/stats'
    next if request.path_info.start_with?('/admin/stats/')
    require_admin!
  end

  api_doc '/admin/users', method: :get do
    tags 'Admin'
    description 'Get all users (admin only)'
    response 200, 'List of all users', example: {
      data: [
        {
          id: 1,
          username: 'johndoe',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          is_banned: false,
          is_email_verified: true
        }
      ]
    }
    response 403, 'Admin access required'
  end

  get '/admin/users' do
    users = User.all(serialize_public_user: false)
    users_data = users.map do |user|
      user.reject { |k, _| k == 'password_digest' }
    end
    { data: users_data }.to_json
  end

  api_doc '/admin/users/:id', method: :delete do
    tags 'Admin'
    description 'Delete a user by ID (admin only)'
    param :id, Integer, required: true, desc: 'User ID to delete'
    response 204, 'User deleted successfully'
    response 403, 'Admin access required'
    response 404, 'User not found'
  end

  delete '/admin/users/:id' do
    user_id = params[:id].to_i
    halt 404, { error: 'User not found' }.to_json unless User.find_by_id(user_id)
    halt 400, { error: 'Cannot delete yourself' }.to_json if user_id == @current_user['id']

    User.delete(user_id)
    status 204
  end

  api_doc '/admin/visits', method: :get do
    tags 'Admin'
    description 'Get recent site visits (admin only)'
    param :limit, Integer, required: false, desc: 'Limit number of results (default: 100)'
    response 200, 'List of recent visits', example: {
      data: [
        {
          id: 1,
          user_id: 42,
          username: 'johndoe',
          visited_at: '2025-04-15T10:30:00Z',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...'
        }
      ]
    }
    response 403, 'Admin access required'
  end

  get '/admin/visits' do
    limit = params[:limit]&.to_i || 100
    visits = SiteVisit.recent(limit)
    { data: visits }.to_json
  end

  api_doc '/admin/visits/stats', method: :get do
    tags 'Admin'
    description 'Get visit statistics by user (admin only)'
    response 200, 'Visit counts by user', example: {
      data: [
        {
          id: 1,
          username: 'johndoe',
          visit_count: 125
        }
      ]
    }
    response 403, 'Admin access required'
  end

  get '/admin/visits/stats' do
    stats = SiteVisit.count_by_user
    { data: stats }.to_json
  end

  api_doc '/admin/stats', method: :get do
    tags 'Admin'
    description 'Get overall website statistics (public)'
    response 200, 'Website statistics', example: {
      data: {
        total_users: 150,
        total_messages: 5234,
        total_dates: 42,
        total_matches: 89,
        recent_logins: [
          {
            username: 'johndoe',
            visited_at: '2025-04-15T10:30:00Z',
            city: 'Paris',
            country: 'France'
          }
        ]
      }
    }
  end

  get '/admin/stats' do
    total_users = User.count
    total_messages = Message.count
    total_dates = Date.count
    total_matches = Like.count_matches
    recent_logins = SiteVisit.recent_with_location(5)

    {
      data: {
        total_users: total_users,
        total_messages: total_messages,
        total_dates: total_dates,
        total_matches: total_matches,
        recent_logins: recent_logins
      }
    }.to_json
  end

  api_doc '/admin/stats/visits-over-time', method: :get do
    tags 'Admin'
    description 'Get site visits grouped by day (public)'
    param :days, Integer, required: false, desc: 'Number of days to fetch (default: 30)'
    response 200, 'Visit counts over time'
  end

  get '/admin/stats/visits-over-time' do
    days = params[:days]&.to_i || 30
    visits_data = SiteVisit.visits_over_time(days)
    { data: visits_data }.to_json
  end

  api_doc '/admin/stats/messages-over-time', method: :get do
    tags 'Admin'
    description 'Get messages sent grouped by day (public)'
    param :days, Integer, required: false, desc: 'Number of days to fetch (default: 30)'
    response 200, 'Message counts over time'
  end

  get '/admin/stats/messages-over-time' do
    days = params[:days]&.to_i || 30
    messages_data = Message.messages_over_time(days)
    { data: messages_data }.to_json
  end

  api_doc '/admin/stats/profile-views-over-time', method: :get do
    tags 'Admin'
    description 'Get profile views grouped by day (public)'
    param :days, Integer, required: false, desc: 'Number of days to fetch (default: 30)'
    response 200, 'Profile view counts over time'
  end

  get '/admin/stats/profile-views-over-time' do
    days = params[:days]&.to_i || 30
    views_data = ProfileView.views_over_time(days)
    { data: views_data }.to_json
  end

  api_doc '/admin/stats/dates-over-time', method: :get do
    tags 'Admin'
    description 'Get scheduled dates grouped by day (public)'
    param :days, Integer, required: false, desc: 'Number of days to fetch (default: 30)'
    response 200, 'Date counts over time'
  end

  get '/admin/stats/dates-over-time' do
    days = params[:days]&.to_i || 30
    dates_data = Date.dates_over_time(days)
    { data: dates_data }.to_json
  end

  api_doc '/admin/stats/user-locations', method: :get do
    tags 'Admin'
    description 'Get all users with their locations and online status (public)'
    response 200, 'User locations', example: {
      data: [
        {
          id: 1,
          username: 'johndoe',
          latitude: 48.8566,
          longitude: 2.3522,
          city: 'Paris',
          country: 'France',
          online_status: true
        }
      ]
    }
  end

  get '/admin/stats/user-locations' do
    users = User.all_with_locations
    { data: users }.to_json
  end

  # Announcements endpoints
  api_doc '/admin/announcements', method: :get do
    tags 'Admin'
    description 'Get all announcements (admin only)'
    response 200, 'List of announcements'
  end

  get '/admin/announcements' do
    announcements = Announcement.all
    { data: announcements }.to_json
  end

  api_doc '/admin/announcements', method: :post do
    tags 'Admin'
    description 'Create a new announcement (admin only)'
    param :title, String, required: true, desc: 'Announcement title'
    param :content, String, required: true, desc: 'Announcement content (supports Markdown)'
    param :expires_at, String, required: false, desc: 'Expiration date (ISO 8601 format)'
    response 201, 'Announcement created'
  end

  post '/admin/announcements' do
    data = json_body

    announcement = Announcement.create(
      data['title'],
      data['content'],
      @current_user['id'],
      data['expires_at']
    )

    # Create notifications for all users
    all_users = User.all(serialize_public_user: false)
    all_users.each do |user|
      next if user['id'] == @current_user['id']

      Notification.create(
        user['id'],
        "New announcement: #{announcement['title']}",
        @current_user['id'],
        'announcement',
        announcement['id'].to_s
      )
    end

    status 201
    { data: announcement }.to_json
  end

  api_doc '/admin/announcements/:id', method: :delete do
    tags 'Admin'
    description 'Delete an announcement (admin only)'
    param :id, Integer, required: true, desc: 'Announcement ID'
    response 204, 'Announcement deleted'
  end

  delete '/admin/announcements/:id' do
    Announcement.delete(params[:id])
    status 204
  end

  api_doc '/admin/announcements/:id/deactivate', method: :patch do
    tags 'Admin'
    description 'Deactivate an announcement (admin only)'
    param :id, Integer, required: true, desc: 'Announcement ID'
    response 200, 'Announcement deactivated'
  end

  patch '/admin/announcements/:id/deactivate' do
    Announcement.deactivate(params[:id])
    { message: 'Announcement deactivated' }.to_json
  end

  api_doc '/admin/users/:username/details', method: :get do
    tags 'Admin'
    description 'Get detailed information about a specific user (admin only)'
    param :username, String, required: true, desc: 'Username to fetch details for'
    response 200, 'User details', example: {
      data: {
        user: {},
        blocked_users: [],
        liked_users: [],
        liked_by_users: [],
        viewed_profiles: [],
        profile_viewers: [],
        matches: [],
        total_messages: 0,
        total_dates: 0
      }
    }
    response 404, 'User not found'
  end

  get '/admin/users/:username/details' do
    username = params[:username]
    user = User.find_by_username(username)

    halt 404, { error: 'User not found' }.to_json unless user

    blocked = BlockedUser.blocked_by(user['id'])
    liked = Like.liked_user_ids(user['id'])
    liked_by = Like.liked_by_user_ids(user['id'])
    viewed = ProfileView.visited(user['id'])
    viewers = ProfileView.views(user['id'])
    matches = Like.matches(user['id'])

    total_messages = Database.with_conn do |conn|
      res = conn.exec_params('SELECT COUNT(*) FROM messages WHERE sender_id = $1', [user['id']])
      res.first['count'].to_i
    end

    total_dates = Database.with_conn do |conn|
      res = conn.exec_params('SELECT COUNT(*) FROM dates WHERE initiator_id = $1', [user['id']])
      res.first['count'].to_i
    end

    {
      data: {
        user: user.reject { |k, _| k == 'password_digest' },
        blocked_users: blocked,
        liked_users: User.find_many_by_ids(liked),
        liked_by_users: User.find_many_by_ids(liked_by),
        viewed_profiles: viewed,
        profile_viewers: viewers,
        matches: matches,
        total_messages: total_messages,
        total_dates: total_dates
      }
    }.to_json
  end
end
