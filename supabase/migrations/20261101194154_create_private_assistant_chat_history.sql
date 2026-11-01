/*
# Private assistant chat history

Moves the AgroIA assistant conversation history from the browser into the database so each farmer sees only their own chats. Before this change, history was kept in the browser and was shared by every account that used the same device.

1. New Tables
- `assistant_messages`: messages of the current conversation. Columns: id (uuid), user_id (defaults to the signed-in user), area (cafe, arroz or cacao), role (user or assistant), text, sources (list of guide names used for an answer), created_at.
- `assistant_saved_chats`: conversations the user chose to save. Columns: id (uuid), user_id (defaults to the signed-in user), name, area, messages (the saved conversation as a list), created_at.

2. Security
- Row level security enabled on both tables.
- Each signed-in user can read, add and delete only their own rows. No update access is granted because messages and saved chats are never edited.
- No access for anonymous visitors.

3. Important notes
- Clearing the current conversation deletes the user's rows in `assistant_messages`; saved chats are not affected.
- Saved chats keep a copy of their messages, so deleting the current conversation does not change them.
*/

CREATE TABLE IF NOT EXISTS assistant_messages (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  area text NOT NULL CHECK (area IN ('cafe', 'arroz', 'cacao')),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 8000),
  sources text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistant_messages_user_idx ON assistant_messages (user_id, created_at);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON assistant_messages FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON assistant_messages TO authenticated;

DROP POLICY IF EXISTS "select_own_assistant_messages" ON assistant_messages;
CREATE POLICY "select_own_assistant_messages" ON assistant_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assistant_messages" ON assistant_messages;
CREATE POLICY "insert_own_assistant_messages" ON assistant_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assistant_messages" ON assistant_messages;
CREATE POLICY "delete_own_assistant_messages" ON assistant_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS assistant_saved_chats (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  area text NOT NULL CHECK (area IN ('cafe', 'arroz', 'cacao')),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistant_saved_chats_user_idx ON assistant_saved_chats (user_id, created_at DESC);

ALTER TABLE assistant_saved_chats ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON assistant_saved_chats FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON assistant_saved_chats TO authenticated;

DROP POLICY IF EXISTS "select_own_saved_chats" ON assistant_saved_chats;
CREATE POLICY "select_own_saved_chats" ON assistant_saved_chats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_chats" ON assistant_saved_chats;
CREATE POLICY "insert_own_saved_chats" ON assistant_saved_chats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_chats" ON assistant_saved_chats;
CREATE POLICY "delete_own_saved_chats" ON assistant_saved_chats FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
