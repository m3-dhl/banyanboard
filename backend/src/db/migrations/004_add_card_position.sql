ALTER TABLE cards ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Backfill stable initial positions per column based on creation order
UPDATE cards c
SET position = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY column_id ORDER BY created_at ASC) AS rn
  FROM cards
) sub
WHERE c.id = sub.id;
