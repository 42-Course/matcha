# frozen_string_literal: true

require_relative '../../app/helpers/database'

Database.with_open_conn do |conn|
  conn.exec <<~SQL
    ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

    ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('like','unlike','view','message','video_call',
                    'match','date','announcement','other','connection'));
  SQL
  conn.close
end
