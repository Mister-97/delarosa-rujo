CREATE TABLE reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_client_select" ON reply_templates
  FOR SELECT USING (
    is_global = true
    OR client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "templates_client_insert" ON reply_templates
  FOR INSERT WITH CHECK (
    client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "templates_client_delete" ON reply_templates
  FOR DELETE USING (
    client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );

-- Seed global default templates
INSERT INTO reply_templates (title, body, is_global, sort_order) VALUES
  ('On our way', 'Great news — our technician is on the way and should arrive within 30–60 minutes!', true, 1),
  ('Call back soon', 'Thanks for reaching out! One of our team members will give you a call back within the hour.', true, 2),
  ('Schedule tomorrow', 'We''d love to help! Can we schedule you for tomorrow morning between 8–10am?', true, 3),
  ('Need more info', 'Thanks for contacting us! Could you share a bit more about the issue so we can send the right technician?', true, 4),
  ('Request address', 'Perfect! Could you share your address so we can get someone out to you?', true, 5),
  ('Appointment confirmed', 'Your appointment is confirmed! Our tech will be there at the time we discussed. See you soon!', true, 6);
