# frozen_string_literal: true

require_relative './base_controller'
require_relative '../models/event'
require_relative '../models/user'
require_relative '../models/notification'
require_relative '../helpers/event_validator'

class EventsController < BaseController
  # ---------------------------
  # LIST UPCOMING EVENTS
  # ---------------------------
  api_doc '/events', method: :get do
    tags 'Events'
    description 'List all upcoming (non-cancelled) events, soonest first'
    response 200, 'Array of events', example: {
      data: [
        {
          id: '1', title: 'Board game night', location: 'Café Luna',
          starts_at: '2026-07-20T19:00:00Z', host_username: 'bob',
          going_count: 4, interested_count: 2
        }
      ]
    }
  end

  get '/events' do
    { data: Event.upcoming }.to_json
  end

  # ---------------------------
  # MY EVENTS (hosting or attending)
  # ---------------------------
  api_doc '/me/events', method: :get do
    tags 'Events', 'User'
    description 'List events the current user is hosting or attending'
    response 200, 'Array of events'
  end

  get '/me/events' do
    { data: Event.for_user(@current_user['id']) }.to_json
  end

  # ---------------------------
  # EVENT DETAIL
  # ---------------------------
  api_doc '/events/:id', method: :get do
    tags 'Events'
    description 'Get an event with host info, counts and attendee list'
    param :id, Integer, required: true, desc: 'Event ID'
    response 200, 'Event details with attendees'
    response 404, 'Event not found', example: { error: 'Event not found' }
  end

  get '/events/:id' do
    event = Event.find_with_meta(params[:id])
    halt 404, { error: 'Event not found' }.to_json unless event

    { data: event.merge('attendees' => Event.attendees(event['id'])) }.to_json
  end

  # ---------------------------
  # CREATE EVENT
  # ---------------------------
  api_doc '/events', method: :post do
    tags 'Events'
    description 'Create (host) a new event'
    param :title, String, required: true, desc: 'Event title (3-255 chars)'
    param :starts_at, String, required: true, desc: 'Start time (ISO 8601)'
    param :ends_at, String, required: false, desc: 'End time (ISO 8601, must be after starts_at)'
    param :description, String, required: false
    param :location, String, required: false
    param :latitude, Float, required: false
    param :longitude, Float, required: false
    param :capacity, Integer, required: false, desc: 'Max "going" attendees'
    response 201, 'Event created'
    response 422, 'Validation error', example: { error: 'Validation failed', details: ['title is required'] }
  end

  post '/events' do
    data = json_body

    begin
      EventValidator.validate_create!(data)
    rescue Errors::ValidationError => e
      halt 422, { error: e.message, details: e.details }.to_json
    end

    event = Event.create(@current_user['id'], data)
    status 201
    { message: 'Event created', data: event }.to_json
  end

  # ---------------------------
  # UPDATE EVENT (host only)
  # ---------------------------
  api_doc '/events/:id', method: :patch do
    tags 'Events'
    description 'Update an event you host'
    param :id, Integer, required: true, desc: 'Event ID'
    response 200, 'Event updated'
    response 403, 'Not the host', example: { error: 'Only the host can edit this event' }
    response 404, 'Event not found', example: { error: 'Event not found' }
    response 422, 'Validation error'
  end

  patch '/events/:id' do
    event = require_host!(params[:id])
    data = json_body

    begin
      EventValidator.validate_update!(data)
    rescue Errors::ValidationError => e
      halt 422, { error: e.message, details: e.details }.to_json
    end

    updated = Event.update(event['id'], data)
    { message: 'Event updated', data: updated }.to_json
  end

  # ---------------------------
  # DELETE EVENT (host only)
  # ---------------------------
  api_doc '/events/:id', method: :delete do
    tags 'Events'
    description 'Delete an event you host'
    param :id, Integer, required: true, desc: 'Event ID'
    response 200, 'Event deleted', example: { message: 'Event deleted' }
    response 403, 'Not the host', example: { error: 'Only the host can delete this event' }
    response 404, 'Event not found', example: { error: 'Event not found' }
  end

  delete '/events/:id' do
    event = require_host!(params[:id])
    Event.delete(event['id'])
    { message: 'Event deleted' }.to_json
  end

  # ---------------------------
  # RSVP
  # ---------------------------
  api_doc '/events/:id/rsvp', method: :post do
    tags 'Events'
    description 'RSVP to an event as going or interested'
    param :id, Integer, required: true, desc: 'Event ID'
    param :status, String, required: false, desc: 'going (default) or interested'
    response 200, 'RSVP recorded'
    response 404, 'Event not found', example: { error: 'Event not found' }
    response 409, 'Event is full', example: { error: 'Event is at capacity' }
    response 422, 'Invalid status'
  end

  post '/events/:id/rsvp' do
    event = Event.find_by_id(params[:id])
    halt 404, { error: 'Event not found' }.to_json unless event
    halt 409, { error: 'Event has been cancelled' }.to_json if event['is_cancelled'] == 't'

    status_param = (json_body['status'] || 'going').to_s
    unless Event::ATTENDANCE_STATUSES.include?(status_param)
      halt 422, { error: "status must be one of: #{Event::ATTENDANCE_STATUSES.join(', ')}" }.to_json
    end

    if status_param == 'going' && event['capacity'] && !already_going?(event, @current_user['id']) &&
       Event.going_count(event['id']) >= event['capacity'].to_i
      halt 409, { error: 'Event is at capacity' }.to_json
    end

    attendance = Event.rsvp(event['id'], @current_user['id'], status_param)

    if event['host_id'] != @current_user['id']
      Notification.create(
        event['host_id'],
        "#{@current_user['username']} is #{status_param} to your event \"#{event['title']}\"",
        @current_user['id'],
        'event'
      )
    end

    { message: 'RSVP recorded', data: attendance }.to_json
  end

  # ---------------------------
  # CANCEL RSVP
  # ---------------------------
  api_doc '/events/:id/rsvp', method: :delete do
    tags 'Events'
    description 'Remove your RSVP from an event'
    param :id, Integer, required: true, desc: 'Event ID'
    response 200, 'RSVP removed', example: { message: 'RSVP removed' }
  end

  delete '/events/:id/rsvp' do
    Event.cancel_rsvp(params[:id], @current_user['id'])
    { message: 'RSVP removed' }.to_json
  end

  private

  # Loads the event and ensures the current user is its host, halting otherwise.
  def require_host!(event_id)
    event = Event.find_by_id(event_id)
    halt 404, { error: 'Event not found' }.to_json unless event
    halt 403, { error: 'Only the host can modify this event' }.to_json unless event['host_id'] == @current_user['id']

    event
  end

  def already_going?(event, user_id)
    Event.attendees(event['id']).any? { |a| a['id'] == user_id && a['status'] == 'going' }
  end
end
