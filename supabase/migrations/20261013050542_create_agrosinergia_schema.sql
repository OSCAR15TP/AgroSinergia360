/*
# AgroSinergia 360 — Schema multi-usuario con aislamiento por propietario

## Resumen
Crea el esquema completo para soportar multiples usuarios autenticados, cada uno con sus propios datos privados. Incluye tablas para diagnosticos de cafe, lotes de arroz, ganado, potreros, eventos de finca, configuracion y configuracion de la API de IA.

## Tablas nuevas

1. **farm_configs** — Configuracion de la finca del usuario (nombre, ubicacion, tamano, modulos activos, clave API de Groq)
   - id (uuid, PK)
   - user_id (uuid, FK a auth.users, DEFAULT auth.uid())
   - farm_name (text)
   - location (text)
   - size (numeric, hectareas)
   - modules_coffee (boolean, default true)
   - modules_rice (boolean, default true)
   - modules_livestock (boolean, default true)
   - groq_api_key (text, nullable — clave API del usuario para IA)
   - last_backup (timestamptz, nullable)
   - created_at, updated_at (timestamptz)

2. **coffee_diagnoses** — Diagnosticos de hojas de cafe
   - id (uuid, PK)
   - user_id (uuid, FK, DEFAULT auth.uid())
   - date (date)
   - result (text: sana, roya, minador, antracnosis, ojo_de_gallo)
   - confidence (numeric)
   - photo_data_url (text, nullable — base64 de la foto)
   - soil_ph, soil_phosphorus, soil_potassium, soil_organic_matter (numeric)
   - recommendation (text)
   - recommendation_type (text)
   - notes (text)
   - created_at (timestamptz)

3. **rice_plots** — Lotes de arroz con sistema SIPAS
   - id (uuid, PK)
   - user_id (uuid, FK, DEFAULT auth.uid())
   - name (text)
   - area (numeric, hectareas)
   - status (text: produccion, rotacion, pastura, preparacion)
   - rotation_phase (int)
   - soil_moisture (numeric, porcentaje)
   - last_rotation_date (date)
   - notes (text)
   - created_at (timestamptz)

4. **cattle** — Registro de animales del hato ganadero
   - id (uuid, PK)
   - user_id (uuid, FK, DEFAULT auth.uid())
   - tag_number (text)
   - breed (text)
   - birth_date (date)
   - weight (numeric, kg)
   - health_status (text)
   - reproductive_status (text)
   - vaccinations (jsonb — array de eventos de vacunacion)
   - weight_history (jsonb — array de registros de peso)
   - notes (text)
   - created_at (timestamptz)

5. **paddocks** — Potreros para pastoreo rotacional
   - id (uuid, PK)
   - user_id (uuid, FK, DEFAULT auth.uid())
   - name (text)
   - area (numeric, hectareas)
   - grass_height (numeric, cm)
   - cattle_count (int)
   - rest_days (int)
   - status (text: en_uso, en_descanso, listo)
   - created_at (timestamptz)

6. **farm_events** — Eventos de la finca (vacunaciones, rotaciones, diagnosticos, etc.)
   - id (uuid, PK)
   - user_id (uuid, FK, DEFAULT auth.uid())
   - date (date)
   - type (text)
   - title (text)
   - description (text)
   - module (text)
   - done (boolean, default false)
   - created_at (timestamptz)

## Seguridad
- RLS habilitado en TODAS las tablas
- 4 politicas por tabla (SELECT, INSERT, UPDATE, DELETE) — scope TO authenticated con auth.uid() = user_id
- user_id tiene DEFAULT auth.uid() para que los inserts funcionen sin pasar user_id explicitamente
- ON DELETE CASCADE en user_id para limpiar datos si se elimina el usuario

## Notas importantes
1. El campo groq_api_key en farm_configs permite que cada usuario guarde su propia clave API de Groq
2. Las vacunaciones y el historial de peso del ganado se almacenan como jsonb para flexibilidad
3. Los datos son completamente privados — cada usuario solo puede ver y modificar sus propios registros
*/ 

-- farm_configs
CREATE TABLE IF NOT EXISTS farm_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name text NOT NULL DEFAULT 'Mi Finca',
  location text DEFAULT '',
  size numeric DEFAULT 0,
  modules_coffee boolean DEFAULT true,
  modules_rice boolean DEFAULT true,
  modules_livestock boolean DEFAULT true,
  groq_api_key text,
  last_backup timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farm_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_farm_config" ON farm_configs;
CREATE POLICY "select_own_farm_config" ON farm_configs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_farm_config" ON farm_configs;
CREATE POLICY "insert_own_farm_config" ON farm_configs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_farm_config" ON farm_configs;
CREATE POLICY "update_own_farm_config" ON farm_configs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_farm_config" ON farm_configs;
CREATE POLICY "delete_own_farm_config" ON farm_configs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- coffee_diagnoses
CREATE TABLE IF NOT EXISTS coffee_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  result text NOT NULL,
  confidence numeric NOT NULL,
  photo_data_url text,
  soil_ph numeric NOT NULL DEFAULT 5.5,
  soil_phosphorus numeric NOT NULL DEFAULT 15,
  soil_potassium numeric NOT NULL DEFAULT 0.4,
  soil_organic_matter numeric NOT NULL DEFAULT 3.5,
  recommendation text NOT NULL,
  recommendation_type text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coffee_diagnoses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_coffee_diagnoses" ON coffee_diagnoses;
CREATE POLICY "select_own_coffee_diagnoses" ON coffee_diagnoses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_coffee_diagnoses" ON coffee_diagnoses;
CREATE POLICY "insert_own_coffee_diagnoses" ON coffee_diagnoses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_coffee_diagnoses" ON coffee_diagnoses;
CREATE POLICY "update_own_coffee_diagnoses" ON coffee_diagnoses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_coffee_diagnoses" ON coffee_diagnoses;
CREATE POLICY "delete_own_coffee_diagnoses" ON coffee_diagnoses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- rice_plots
CREATE TABLE IF NOT EXISTS rice_plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  area numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'preparacion',
  rotation_phase int NOT NULL DEFAULT 0,
  soil_moisture numeric NOT NULL DEFAULT 50,
  last_rotation_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rice_plots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rice_plots" ON rice_plots;
CREATE POLICY "select_own_rice_plots" ON rice_plots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rice_plots" ON rice_plots;
CREATE POLICY "insert_own_rice_plots" ON rice_plots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_rice_plots" ON rice_plots;
CREATE POLICY "update_own_rice_plots" ON rice_plots FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_rice_plots" ON rice_plots;
CREATE POLICY "delete_own_rice_plots" ON rice_plots FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- cattle
CREATE TABLE IF NOT EXISTS cattle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_number text NOT NULL,
  breed text DEFAULT '',
  birth_date date,
  weight numeric NOT NULL DEFAULT 0,
  health_status text NOT NULL DEFAULT 'sano',
  reproductive_status text NOT NULL DEFAULT 'vacia',
  vaccinations jsonb NOT NULL DEFAULT '[]'::jsonb,
  weight_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cattle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cattle" ON cattle;
CREATE POLICY "select_own_cattle" ON cattle FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cattle" ON cattle;
CREATE POLICY "insert_own_cattle" ON cattle FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cattle" ON cattle;
CREATE POLICY "update_own_cattle" ON cattle FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cattle" ON cattle;
CREATE POLICY "delete_own_cattle" ON cattle FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- paddocks
CREATE TABLE IF NOT EXISTS paddocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  area numeric NOT NULL DEFAULT 0,
  grass_height numeric NOT NULL DEFAULT 25,
  cattle_count int NOT NULL DEFAULT 0,
  rest_days int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'en_uso',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE paddocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_paddocks" ON paddocks;
CREATE POLICY "select_own_paddocks" ON paddocks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_paddocks" ON paddocks;
CREATE POLICY "insert_own_paddocks" ON paddocks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_paddocks" ON paddocks;
CREATE POLICY "update_own_paddocks" ON paddocks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_paddocks" ON paddocks;
CREATE POLICY "delete_own_paddocks" ON paddocks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- farm_events
CREATE TABLE IF NOT EXISTS farm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  module text NOT NULL DEFAULT 'general',
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE farm_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_farm_events" ON farm_events;
CREATE POLICY "select_own_farm_events" ON farm_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_farm_events" ON farm_events;
CREATE POLICY "insert_own_farm_events" ON farm_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_farm_events" ON farm_events;
CREATE POLICY "update_own_farm_events" ON farm_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_farm_events" ON farm_events;
CREATE POLICY "delete_own_farm_events" ON farm_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coffee_diagnoses_user ON coffee_diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_rice_plots_user ON rice_plots(user_id);
CREATE INDEX IF NOT EXISTS idx_cattle_user ON cattle(user_id);
CREATE INDEX IF NOT EXISTS idx_paddocks_user ON paddocks(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_events_user ON farm_events(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_configs_user ON farm_configs(user_id);
