# frozen_string_literal: true

require_relative './base_controller'
require_relative '../models/announcement'

class AnnouncementsController < BaseController
  api_doc '/announcements/:id', method: :get do
    tags 'Announcements'
    description 'Get announcement details by ID'
    param :id, Integer, required: true, desc: 'Announcement ID'
    response 200, 'Announcement details'
    response 404, 'Announcement not found'
  end

  get '/announcements/:id' do
    announcement = Announcement.find_by_id(params[:id])
    halt 404, { error: 'Announcement not found' }.to_json unless announcement

    { data: announcement }.to_json
  end
end
