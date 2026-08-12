# frozen_string_literal: true

require 'faraday'
require 'json'

# Thin wrapper over OpenPanel's REST API (there is no official Ruby SDK).
#
# Everything here is fire-and-forget: events go on a queue drained by a single
# background thread, and every failure is swallowed. Analytics must never slow
# down a request or take the API down with it.
#
# Disabled (a silent no-op) unless OPENPANEL_CLIENT_ID/SECRET are set, so dev
# and test runs don't ship events anywhere.
module Openpanel
  API_URL = ENV.fetch('OPENPANEL_API_URL', 'https://api.openpanel.dev')
  CLIENT_ID = ENV['OPENPANEL_CLIENT_ID']
  CLIENT_SECRET = ENV['OPENPANEL_CLIENT_SECRET']

  # One `visit` event per user per window, instead of one per API call.
  VISIT_WINDOW = 900 # 15 minutes
  # Drop events rather than grow forever if OpenPanel is unreachable.
  MAX_QUEUE = 1_000

  @queue = Queue.new
  @mutex = Mutex.new
  @seen = {}

  class << self
    def enabled?
      !CLIENT_ID.to_s.empty? && !CLIENT_SECRET.to_s.empty?
    end

    # Record a named event. `profile_id` ties it to a user, `ip` gives OpenPanel
    # the geo lookup and `user_agent` the device breakdown.
    def track(name, profile_id: nil, properties: {}, ip: nil, user_agent: nil)
      enqueue('track', { name: name, profileId: profile_id&.to_s, properties: properties }, ip, user_agent)
    end

    # Create/update the user profile behind a profileId.
    def identify(profile_id, properties = {}, ip: nil, user_agent: nil)
      enqueue('identify', { profileId: profile_id.to_s, **properties }, ip, user_agent)
    end

    # Called on every authenticated request, so it throttles: a page that fires
    # ten API calls should be one visit, not ten.
    def track_visit(profile_id, ip, user_agent, path: nil)
      return unless enabled?
      return unless fresh_visit?(profile_id)

      track('visit', profile_id: profile_id, properties: { path: path }.compact, ip: ip, user_agent: user_agent)
    end

    # Single background thread draining the queue; started on first event.
    def worker
      @worker ||= Thread.new do
        while (job = @queue.pop)
          begin
            deliver(*job)
          rescue StandardError => e
            log("delivery failed: #{e.class}: #{e.message}")
          end
        end
      end
    end

    private

    # ponytail: per-process throttle, so N puma workers can emit up to N visits
    # per window. Move to Redis (already a dependency) if that skew matters.
    def fresh_visit?(profile_id)
      now = Time.now.to_i
      @mutex.synchronize do
        @seen.delete_if { |_, seen_at| now - seen_at > VISIT_WINDOW } if @seen.size > 10_000
        last = @seen[profile_id]
        next false if last && now - last < VISIT_WINDOW

        @seen[profile_id] = now
        true
      end
    end

    def enqueue(type, payload, ip, user_agent)
      return unless enabled?

      if @queue.size >= MAX_QUEUE
        log("queue full, dropping #{type} event")
        return
      end

      worker
      @queue << [type, payload.compact, ip, user_agent]
      nil
    end

    def deliver(type, payload, ip, user_agent)
      connection.post('/track') do |req|
        req.headers['content-type'] = 'application/json'
        req.headers['openpanel-client-id'] = CLIENT_ID
        req.headers['openpanel-client-secret'] = CLIENT_SECRET
        req.headers['x-client-ip'] = ip if ip
        req.headers['user-agent'] = user_agent if user_agent
        req.body = { type: type, payload: payload }.to_json
      end
    end

    def connection
      @connection ||= Faraday.new(url: API_URL) do |f|
        f.options.timeout = 5
        f.options.open_timeout = 2
      end
    end

    def log(msg)
      defined?(LOGGER) ? LOGGER.warn("[openpanel] #{msg}") : warn("[openpanel] #{msg}")
    end
  end
end
