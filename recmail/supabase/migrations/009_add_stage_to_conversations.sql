ALTER TABLE conversations
  ADD COLUMN stage TEXT NOT NULL DEFAULT 'new'
  CHECK (stage IN ('new', 'contacted', 'quoted', 'booked', 'won', 'lost'));
