CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  twilio_number TEXT NOT NULL UNIQUE,
  twilio_account_sid TEXT,
  gemini_prompt_override TEXT,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_owner_select" ON clients
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "clients_owner_update" ON clients
  FOR UPDATE USING (owner_id = auth.uid());
