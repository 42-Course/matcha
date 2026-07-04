# frozen_string_literal: true

require_relative './app'
require_relative './ws_server'
require 'rack/protection'

# NOTE: We intentionally do NOT rely on `rackup`'s development middleware stack.
# In development, rackup wraps the app in `Rack::Lint`, which rejects the async
# response (status -1) that Faye::WebSocket returns from `rack_response`, turning
# every WebSocket upgrade into a spurious 500 (and flooding the logs). We build
# the stack ourselves here (request logging + dev error pages, but no Lint) and
# run under puma directly.
development = ENV.fetch('RACK_ENV', 'development') == 'development'

use Rack::CommonLogger
use Rack::ShowExceptions if development

map '/' do
  run MatchaApp
end

map '/ws' do
  run WebSocketServer
end
