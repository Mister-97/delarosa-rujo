CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  twilio_sid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE UNIQUE INDEX messages_twilio_sid_idx ON messages(twilio_sid) WHERE twilio_sid IS NOT NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_via_conversation" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id IN (
        SELECT client_id FROM users WHERE id = auth.uid()
      )
    )
  );
