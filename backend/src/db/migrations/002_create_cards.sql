CREATE TABLE IF NOT EXISTS cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(100) NOT NULL,
  column_id   VARCHAR(20) NOT NULL CHECK (column_id IN ('todo', 'in-progress', 'done')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
