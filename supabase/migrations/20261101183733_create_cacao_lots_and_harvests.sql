/*
# Create cacao lots and harvests

1. New Tables
- `cacao_lots`: cacao planting lots registered by the farmer (name, area in hectares, number of trees, variety, planting year, notes).
- `cacao_harvests`: harvest records tied to a lot (date, number of pods harvested, wet beans in kg, dry beans in kg, notes).

2. Modified Tables
- `farm_configs`: adds `modules_cacao` (boolean, default true) so the cacao module can be toggled like coffee and rice.

3. Security
- Enable RLS on both new tables.
- Grant CRUD to `authenticated` only; each user can only access rows they own.
- Owner column defaults to `auth.uid()`.

4. Notes
- Nothing is dropped or altered beyond the addition of the new column.
*/

CREATE TABLE IF NOT EXISTS cacao_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  area numeric NOT NULL DEFAULT 0,
  trees integer NOT NULL DEFAULT 0,
  variety text NOT NULL DEFAULT '',
  planting_year integer,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cacao_harvests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lot_id uuid NOT NULL REFERENCES cacao_lots(id) ON DELETE CASCADE,
  date date NOT NULL,
  pods integer NOT NULL DEFAULT 0,
  wet_kg numeric NOT NULL DEFAULT 0,
  dry_kg numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cacao_lots_user_id_idx ON cacao_lots (user_id);
CREATE INDEX IF NOT EXISTS cacao_harvests_user_id_idx ON cacao_harvests (user_id);
CREATE INDEX IF NOT EXISTS cacao_harvests_lot_id_idx ON cacao_harvests (lot_id);

ALTER TABLE cacao_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cacao_harvests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON cacao_lots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cacao_harvests TO authenticated;

DROP POLICY IF EXISTS "select_own_cacao_lots" ON cacao_lots;
CREATE POLICY "select_own_cacao_lots" ON cacao_lots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cacao_lots" ON cacao_lots;
CREATE POLICY "insert_own_cacao_lots" ON cacao_lots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cacao_lots" ON cacao_lots;
CREATE POLICY "update_own_cacao_lots" ON cacao_lots FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cacao_lots" ON cacao_lots;
CREATE POLICY "delete_own_cacao_lots" ON cacao_lots FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_cacao_harvests" ON cacao_harvests;
CREATE POLICY "select_own_cacao_harvests" ON cacao_harvests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cacao_harvests" ON cacao_harvests;
CREATE POLICY "insert_own_cacao_harvests" ON cacao_harvests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cacao_harvests" ON cacao_harvests;
CREATE POLICY "update_own_cacao_harvests" ON cacao_harvests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cacao_harvests" ON cacao_harvests;
CREATE POLICY "delete_own_cacao_harvests" ON cacao_harvests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

ALTER TABLE farm_configs ADD COLUMN IF NOT EXISTS modules_cacao boolean DEFAULT true;
