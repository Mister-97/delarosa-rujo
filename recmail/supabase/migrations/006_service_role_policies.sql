-- Service role bypasses RLS by default, but we add explicit insert policies
-- for documentation and to support anon-key use cases in the future.

CREATE POLICY "conversations_service_insert" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_service_insert" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "summaries_service_insert" ON summaries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "summaries_service_update" ON summaries
  FOR UPDATE USING (true);
