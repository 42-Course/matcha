# frozen_string_literal: true

ENV['APP_ENV'] = 'test'

require 'rack/test'
require 'rspec'
require_relative '../app'

RSpec.configure do |config|
  config.include Rack::Test::Methods
  config.formatter = :documentation
  config.color = true

  def app
    MatchaApp
  end

  # Clean every table between examples so tests are fully isolated. Uses the
  # self-healing pool (never closes the pooled connection — doing so hands the
  # next example a dead socket) and TRUNCATE ... CASCADE to reset all rows and
  # serial ids in one statement regardless of foreign-key order.
  config.before(:each) do
    Database.with_conn do |conn|
      tables = conn.exec(<<~SQL).map { |row| row['tablename'] }
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      SQL
      next if tables.empty?

      quoted = tables.map { |t| %("#{t}") }.join(', ')
      conn.exec("TRUNCATE #{quoted} RESTART IDENTITY CASCADE")
    end
  end
end
