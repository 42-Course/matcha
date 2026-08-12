# frozen_string_literal: true

require 'rspec'
# Deliberately not spec_helper: this lib touches no database, so requiring the
# whole app (and its Postgres connection) would only make the spec fragile.
require_relative '../../app/lib/openpanel'

RSpec.describe Openpanel do
  # The two things that can silently break: the visit throttle (spamming one
  # event per API call) and the wire payload shape.
  before do
    described_class.instance_variable_set(:@seen, {})
    described_class.instance_variable_get(:@queue).clear
  end

  describe '.track_visit' do
    context 'when credentials are missing' do
      it 'is a no-op' do
        allow(described_class).to receive(:enabled?).and_return(false)
        described_class.track_visit(1, '1.2.3.4', 'curl')
        expect(described_class.instance_variable_get(:@queue).size).to eq(0)
      end
    end

    context 'when enabled' do
      before do
        allow(described_class).to receive(:enabled?).and_return(true)
        allow(described_class).to receive(:worker) # don't hit the network
      end

      it 'records one visit per user per window, not one per call' do
        5.times { described_class.track_visit(42, '1.2.3.4', 'curl', path: '/me') }
        expect(described_class.instance_variable_get(:@queue).size).to eq(1)
      end

      it 'keeps different users apart' do
        described_class.track_visit(1, '1.2.3.4', 'curl')
        described_class.track_visit(2, '1.2.3.4', 'curl')
        expect(described_class.instance_variable_get(:@queue).size).to eq(2)
      end

      it 'lets the user through again once the window has passed' do
        described_class.track_visit(7, '1.2.3.4', 'curl')
        seen = described_class.instance_variable_get(:@seen)
        seen[7] -= (Openpanel::VISIT_WINDOW + 1)
        described_class.track_visit(7, '1.2.3.4', 'curl')
        expect(described_class.instance_variable_get(:@queue).size).to eq(2)
      end

      it 'queues the payload shape OpenPanel expects' do
        described_class.track('like', profile_id: 9, properties: { target: 'bob' }, ip: '1.2.3.4', user_agent: 'curl')
        type, payload, ip, user_agent = described_class.instance_variable_get(:@queue).pop
        expect(type).to eq('track')
        expect(payload).to eq({ name: 'like', profileId: '9', properties: { target: 'bob' } })
        expect(ip).to eq('1.2.3.4')
        expect(user_agent).to eq('curl')
      end

      it 'drops events instead of growing forever when OpenPanel is down' do
        queue = described_class.instance_variable_get(:@queue)
        Openpanel::MAX_QUEUE.times { queue << %w[track x] }
        described_class.track('like', profile_id: 1)
        expect(queue.size).to eq(Openpanel::MAX_QUEUE)
      end
    end
  end
end
