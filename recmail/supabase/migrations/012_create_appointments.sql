CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX appointments_client_id_idx ON appointments(client_id);
CREATE INDEX appointments_scheduled_at_idx ON appointments(scheduled_at);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_client_select" ON appointments
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "appointments_client_insert" ON appointments
  FOR INSERT WITH CHECK (
    client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "appointments_client_update" ON appointments
  FOR UPDATE USING (
    client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );

-- Service role insert
CREATE POLICY "appointments_service_insert" ON appointments
  FOR INSERT WITH CHECK (true);
