# frozen_string_literal: true

require 'active_record'

# Standalone ActiveRecord (no Rails). We reuse the same DATABASE_URL the rest of
# the app uses. ActiveRecord manages its own connection pool; keep it in step
# with the app's DB budget so all app machines together stay under Postgres'
# max_connections (see app/helpers/database.rb for the same reasoning).
db_config = { 'url' => ENV['DATABASE_URL'] }
db_config['pool'] = (ENV['DB_POOL_SIZE'] || 10).to_i
db_config['checkout_timeout'] = (ENV['DB_POOL_TIMEOUT'] || 5).to_i

ActiveRecord::Base.establish_connection(db_config)

# JSON contract: render timestamps as ISO-8601 strings. Booleans already
# serialize as true/false and integers as numbers, which is the typed JSON
# shape we are moving the API to.
ActiveRecord::Base.time_zone_aware_attributes = false

# Quieter logs in normal runs; flip on with AR_DEBUG=1 when diagnosing SQL.
ActiveRecord::Base.logger = Logger.new($stdout) if ENV['AR_DEBUG']
