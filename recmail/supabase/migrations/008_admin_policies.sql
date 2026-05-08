-- Internal RecMail operators table (only service role can write)
CREATE TABLE admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_self_select" ON admins
  FOR SELECT USING (user_id = auth.uid());

-- Admins can access all clients
CREATE POLICY "admin_clients_all" ON clients
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Admins can access all conversations
CREATE POLICY "admin_conversations_all" ON conversations
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Admins can access all messages
CREATE POLICY "admin_messages_all" ON messages
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Admins can access all summaries
CREATE POLICY "admin_summaries_all" ON summaries
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Admins can access all users
CREATE POLICY "admin_users_all" ON users
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );
