/*
# Remove livestock module from the database

The livestock (ganadería) module was removed from the app because it does not apply to the farm's region. This migration deletes the database objects it used. Both tables were empty before removal, so no user data is lost.

1. Removed Tables
- `cattle`: livestock records (0 rows at removal time).
- `paddocks`: livestock paddock records (0 rows at removal time).

2. Modified Tables
- `farm_configs`: the `modules_livestock` column, which stored the old module on/off setting.

3. Security
- No policies or grants remain for the removed objects; nothing else in the database depended on them.

4. Important notes
- Uses IF EXISTS so the migration can be safely re-applied.
- Cascade is not used: if another object depended on these, the migration would fail instead of removing it silently.
*/

DROP TABLE IF EXISTS cattle;
DROP TABLE IF EXISTS paddocks;
ALTER TABLE farm_configs DROP COLUMN IF EXISTS modules_livestock;
