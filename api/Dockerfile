FROM ruby:3.2

WORKDIR /app
COPY . /app

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev
RUN gem install bundler
RUN bundle install

EXPOSE 9292

# Run puma directly rather than via `rackup`: rackup's development middleware
# injects Rack::Lint, which rejects Faye::WebSocket's async response and breaks
# WebSocket upgrades. See config.ru for the hand-built middleware stack.
CMD ["bundle", "exec", "puma", "-b", "tcp://0.0.0.0:9292", "config.ru"]
