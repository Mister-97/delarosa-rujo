CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  lead_type TEXT,
  urgency SMALLINT CHECK (urgency BETWEEN 1 AND 5),
  extracted_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX summaries_conversation_id_idx ON summaries(conversation_id);

ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "summaries_via_conversation" ON summaries
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id IN (
        SELECT client_id FROM users WHERE id = auth.uid()
      )
    )
  );
