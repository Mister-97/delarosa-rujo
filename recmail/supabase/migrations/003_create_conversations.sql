CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'qualified')),
  turn_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conversations_client_id_idx ON conversations(client_id);
CREATE INDEX conversations_customer_phone_idx ON conversations(customer_phone);
CREATE INDEX conversations_status_idx ON conversations(status);

-- Prevent duplicate open conversations for same customer+client
CREATE UNIQUE INDEX conversations_active_customer_idx
  ON conversations(client_id, customer_phone)
  WHERE status = 'open';

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_client_select" ON conversations
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "conversations_client_update" ON conversations
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM users WHERE id = auth.uid()
    )
  );
