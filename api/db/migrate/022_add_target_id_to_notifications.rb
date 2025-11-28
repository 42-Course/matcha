# frozen_string_literal: true

def up
  Database.pool.with do |conn|
    conn.exec(<<~SQL)
      ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS target_id TEXT;

      ALTER TABLE notifications
      DROP CONSTRAINT IF EXISTS notifications_type_check;

      ALTER TABLE notifications
      ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('like', 'unlike', 'view', 'message', 'video_call', 'match', 'date', 'announcement', 'other', 'connection'));
    SQL
  end
end

def down
  Database.pool.with do |conn|
    conn.exec(<<~SQL)
      ALTER TABLE notifications
      DROP COLUMN IF EXISTS target_id;

      ALTER TABLE notifications
      DROP CONSTRAINT IF EXISTS notifications_type_check;

      ALTER TABLE notifications
      ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('like', 'unlike', 'view', 'message', 'video_call', 'match', 'date', 'other'));
    SQL
  end
end
