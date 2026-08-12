# frozen_string_literal: true

require 'sinatra/base'
require_relative '../helpers/request_helper'
require_relative '../helpers/session_token'
require_relative '../lib/errors'
require_relative '../lib/openpanel'
require_relative '../models/site_visit'

class BaseController < Sinatra::Base
  include APIDoc

  before do
    content_type :json

    next if request.request_method == 'OPTIONS'
    next if request.path_info == '/' || request.path_info.start_with?('/auth') || request.path_info.start_with?('/email')

    require_auth!
  end

  helpers do
    def json_body
      body = request.body.read

      begin
        RequestHelper.safe_json_parse(body)
      rescue Errors::ValidationError => e
        halt 400, { error: e.message }.to_json
      end
    end

    def client_ip
      # When behind a proxy (like Fly.io), get the real client IP from X-Forwarded-For header
      # Take the first IP in the chain (the original client)
      request.env['HTTP_X_FORWARDED_FOR']&.split(',')&.first&.strip || request.ip
    end

    def require_auth!
      token = request.env['HTTP_AUTHORIZATION']&.sub(/^Bearer /, '')
      halt 401, { error: 'Missing or invalid Authorization header' }.to_json unless token

      payload = SessionToken.decode(token)
      halt 401, { error: 'Invalid or expired session token' }.to_json unless payload

      user = User.find_by_id(payload['user_id'])
      halt 401, { error: 'Invalid user' }.to_json unless user
      halt 403, { error: 'Email not verified' }.to_json unless user['is_email_verified'] == 't'
      halt 403, { error: 'Account is banned' }.to_json if user['is_banned'] == 't'

      @current_user = user

      SiteVisit.record(user['id'], client_ip, request.user_agent)
      Openpanel.track_visit(user['id'], client_ip, request.user_agent, path: request.path_info)
    end

    # Domain events. Same identity/IP/user-agent as the visit above, so every
    # event lands on the right profile with geo and device attached.
    # `user:` is only passed on the auth routes, where @current_user isn't set yet.
    def track_event(name, user: @current_user, **properties)
      Openpanel.track(
        name,
        profile_id: user&.dig('id'),
        properties: properties,
        ip: client_ip,
        user_agent: request.user_agent
      )
    end

    # Push the user's profile fields to OpenPanel so events show a name, not an id.
    def track_identify(user)
      Openpanel.identify(
        user['id'],
        { firstName: user['first_name'], lastName: user['last_name'], email: user['email'],
          properties: { username: user['username'] } },
        ip: client_ip,
        user_agent: request.user_agent
      )
    end

    def require_admin!
      halt 403, { error: 'Admin access required' }.to_json unless @current_user['username'] == 'pulgamecanica'
    end
  end
end
