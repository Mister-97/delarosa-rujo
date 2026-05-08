CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX follow_ups_conversation_id_idx ON follow_ups(conversation_id);
CREATE INDEX follow_ups_status_scheduled_idx ON follow_ups(status, scheduled_at);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follow_ups_via_conversation" ON follow_ups
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
    )
  );
