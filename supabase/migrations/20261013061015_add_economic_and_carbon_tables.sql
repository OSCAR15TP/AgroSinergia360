/*
# AgroSinergia 360 — Tablas de Análisis Económico y Huella de Carbono

## Resumen
Añade dos tablas nuevas para soportar análisis económico por módulo (café, arroz, ganadería)
y cálculo de huella de carbono de la finca. Ambas con aislamiento por usuario.

## Tablas nuevas

1. **economic_records** — Registros de análisis económico por cosecha
   - id (uuid, PK)
   - user_id (uuid, FK a auth.users, DEFAULT auth.uid())
   - module (text: coffee, rice, livestock)
   - date (date)
   - area (numeric, hectáreas)
   - production_kg (numeric, kg cosechados)
   - price_per_kg (numeric, precio por kg)
   - cost_seeds, cost_fertilizer, cost_labor, cost_transport, cost_other (numeric)
   - merma_pct (numeric, porcentaje de merma/secado)
   - notes (text)
   - created_at (timestamptz)

2. **carbon_records** — Registros de huella de carbono de la parcela
   - id (uuid, PK)
   - user_id (uuid, FK a auth.users, DEFAULT auth.uid())
   - date (date)
   - area (numeric, hectáreas)
   - fertilizer_kg (numeric, kg de fertilizante sintético)
   - fuel_liters (numeric, litros de combustible)
   - fuel_type (text: diesel, gasolina, electrico)
   - electricity_kwh (numeric, kWh consumidos)
   - shade_trees (int, número de árboles de sombra)
   - notes (text)
   - created_at (timestamptz)

## Seguridad
- RLS habilitado en ambas tablas
- 4 políticas por tabla (SELECT, INSERT, UPDATE, DELETE) — scope TO authenticated con auth.uid() = user_id
- user_id tiene DEFAULT auth.uid()
*/

-- economic_records
CREATE TABLE IF NOT EXISTS economic_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  date date NOT NULL,
  area numeric NOT NULL DEFAULT 0,
  production_kg numeric NOT NULL DEFAULT 0,
  price_per_kg numeric NOT NULL DEFAULT 0,
  cost_seeds numeric NOT NULL DEFAULT 0,
  cost_fertilizer numeric NOT NULL DEFAULT 0,
  cost_labor numeric NOT NULL DEFAULT 0,
  cost_transport numeric NOT NULL DEFAULT 0,
  cost_other numeric NOT NULL DEFAULT 0,
  merma_pct numeric NOT NULL DEFAULT 40,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE economic_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_economic_records" ON economic_records;
CREATE POLICY "select_own_economic_records" ON economic_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_economic_records" ON economic_records;
CREATE POLICY "insert_own_economic_records" ON economic_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_economic_records" ON economic_records;
CREATE POLICY "update_own_economic_records" ON economic_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_economic_records" ON economic_records;
CREATE POLICY "delete_own_economic_records" ON economic_records FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- carbon_records
CREATE TABLE IF NOT EXISTS carbon_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  area numeric NOT NULL DEFAULT 0,
  fertilizer_kg numeric NOT NULL DEFAULT 0,
  fuel_liters numeric NOT NULL DEFAULT 0,
  fuel_type text NOT NULL DEFAULT 'diesel',
  electricity_kwh numeric NOT NULL DEFAULT 0,
  shade_trees int NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE carbon_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_carbon_records" ON carbon_records;
CREATE POLICY "select_own_carbon_records" ON carbon_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_carbon_records" ON carbon_records;
CREATE POLICY "insert_own_carbon_records" ON carbon_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_carbon_records" ON carbon_records;
CREATE POLICY "update_own_carbon_records" ON carbon_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_carbon_records" ON carbon_records;
CREATE POLICY "delete_own_carbon_records" ON carbon_records FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_economic_records_user ON economic_records(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_records_user ON carbon_records(user_id);
