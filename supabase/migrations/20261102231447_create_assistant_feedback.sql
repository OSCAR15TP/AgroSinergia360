/*
# Assistant answer feedback linked to guides

Lets signed-in farmers say whether an AgroIA answer helped them. Each rating records which local guide the answer came from, so the team can see which guides need review.

1. New Tables
- `assistant_feedback`: one rating per answer and farmer. Columns: id, user_id (defaults to the signed-in user), message_id (the answer being rated), area (cafe, arroz or cacao), guide_title (guide used for the answer, if any), helpful (true or false), consent_to_review (whether the farmer agreed to share the content), question and answer (only stored when consent_to_review is true), created_at.

2. Security
- Row level security enabled.
- Signed-in users can only insert their own feedback. They cannot read, edit or delete feedback, including their own.
- Anonymous visitors have no access.
- A database rule ensures question and answer are empty unless the farmer gave consent.
- Team review happens through the database dashboard, which is not limited by these rules.

3. Important notes
- One rating per answer per farmer, enforced by a unique constraint.
*/

CREATE TABLE IF NOT EXISTS assistant_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL,
  area text NOT NULL CHECK (area IN ('cafe', 'arroz', 'cacao')),
  guide_title text CHECK (guide_title IS NULL OR char_length(guide_title) <= 200),
  helpful boolean NOT NULL,
  consent_to_review boolean NOT NULL DEFAULT false,
  question text CHECK (question IS NULL OR char_length(question) <= 8000),
  answer text CHECK (answer IS NULL OR char_length(answer) <= 8000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assistant_feedback_consent_check CHECK (consent_to_review OR (question IS NULL AND answer IS NULL)),
  CONSTRAINT assistant_feedback_one_per_answer UNIQUE (user_id, message_id)
);

CREATE INDEX IF NOT EXISTS assistant_feedback_guide_idx ON assistant_feedback (guide_title, helpful);

ALTER TABLE assistant_feedback ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON assistant_feedback FROM anon, authenticated;
GRANT INSERT ON assistant_feedback TO authenticated;

DROP POLICY IF EXISTS "insert_own_assistant_feedback" ON assistant_feedback;
CREATE POLICY "insert_own_assistant_feedback" ON assistant_feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
