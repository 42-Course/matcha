# frozen_string_literal: true

# app/helpers/event_validator.rb
require 'time'
require_relative './validator'
require_relative '../lib/errors'

module EventValidator
  def self.validate_create!(params)
    Validator.validate!(
      params: params,
      required: %i[title starts_at],
      length: { title: { min: 3, max: 255 } }
    )

    validate_times!(params)
    validate_capacity!(params)
  end

  def self.validate_update!(params)
    Validator.validate!(
      params: params,
      length: { title: { min: 3, max: 255 } }
    )

    validate_times!(params, require_start: false)
    validate_capacity!(params)
  end

  def self.validate_times!(params, require_start: true)
    starts_at = parse_time(params['starts_at'] || params[:starts_at], 'starts_at') if require_start || params['starts_at']
    ends_at   = parse_time(params['ends_at'] || params[:ends_at], 'ends_at') if params['ends_at'] || params[:ends_at]

    return unless starts_at && ends_at
    return if ends_at > starts_at

    raise Errors::ValidationError.new('Validation failed', ['ends_at must be after starts_at'])
  end

  def self.validate_capacity!(params)
    capacity = params['capacity'] || params[:capacity]
    return if capacity.nil?
    return if capacity.is_a?(Integer) && capacity.positive?

    raise Errors::ValidationError.new('Validation failed', ['capacity must be a positive integer'])
  end

  def self.parse_time(value, field)
    Time.parse(value.to_s)
  rescue ArgumentError, TypeError
    raise Errors::ValidationError.new('Validation failed', ["#{field} must be a valid datetime string"])
  end

  private_class_method :validate_times!, :validate_capacity!, :parse_time
end
