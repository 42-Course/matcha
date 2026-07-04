# frozen_string_literal: true

require 'net/http'
require 'json'
require 'ipaddr'
require_relative './errors'

module Geolocation
  API_URL = 'http://ip-api.com/json/'
  EARTH_RADIUS_KM = 6371.0

  # Private/loopback/link-local/reserved ranges can't be geolocated by ip-api.com
  # (this is the normal case in local Docker, where the client IP is the gateway).
  # Callers should treat a nil result as "location unknown" and skip recording.
  def self.private_ip?(ip)
    addr = IPAddr.new(ip.to_s)
    addr.loopback? || addr.private? || addr.link_local? ||
      addr == IPAddr.new('0.0.0.0')
  rescue IPAddr::Error
    false
  end

  def self.lookup(ip)
    return nil if private_ip?(ip)

    uri = URI("#{API_URL}#{ip}?fields=status,message,country,city,lat,lon")
    response = Net::HTTP.get_response(uri)
    raise Errors::ValidationError, 'Geolocation service failed' unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)

    unless data['status'] == 'success'
      raise Errors::ValidationError, "Geolocation failed: #{data['message'] || 'unknown error'}. IP: [#{ip}]."
    end

    {
      country: data['country'],
      city: data['city'],
      latitude: data['lat'],
      longitude: data['lon']
    }
  rescue StandardError => e
    raise Errors::ValidationError, "Failed to geolocate IP: #{e.message}"
  end

  def self.haversine_distance(lat1, lon1, lat2, lon2)
    return nil unless lat1 && lon1 && lat2 && lon2

    dlat = to_rad(lat2 - lat1)
    dlon = to_rad(lon2 - lon1)

    a = Math.sin(dlat / 2)**2 +
        Math.cos(to_rad(lat1)) * Math.cos(to_rad(lat2)) * Math.sin(dlon / 2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    (EARTH_RADIUS_KM * c).round(2)
  end

  def self.to_rad(degrees)
    degrees * Math::PI / 180
  end
end
