/*
# Revert cacao database tables

1. Removed Tables
- `cacao_harvests` and `cacao_lots`: created earlier in this session with no rows. The app has no Supabase sign-in, so owner-scoped policies cannot identify the user. Cacao data is stored locally with the other farm modules instead.

2. Modified Tables
- `farm_configs`: removes `modules_cacao`, added earlier in this session, to match the local storage approach.

3. Notes
- No user data is affected. These objects held zero rows.
*/

DROP TABLE IF EXISTS cacao_harvests;
DROP TABLE IF EXISTS cacao_lots;
ALTER TABLE farm_configs DROP COLUMN IF EXISTS modules_cacao;
