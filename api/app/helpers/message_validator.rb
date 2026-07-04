# frozen_string_literal: true

require_relative '../lib/errors'

module MessageValidator
  # Messages are intentionally short and rationed. See MessagesController and
  # Message.sent_today? for the "one message per conversation per day" rule.
  MAX_LENGTH = 300

  def self.validate_create!(params)
    Validator.validate!(
      params: params,
      required: [:content],
      length: {
        content: { min: 1, max: MAX_LENGTH }
      }
    )
  end
end
