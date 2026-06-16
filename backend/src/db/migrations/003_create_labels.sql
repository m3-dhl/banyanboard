-- Labels: board-scoped label definitions
CREATE TABLE IF NOT EXISTS labels (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(50)  NOT NULL,
  color      VARCHAR(7)   NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  board_id   UUID         NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_label_name_per_board UNIQUE (name, board_id)
);

CREATE TABLE IF NOT EXISTS card_labels (
  card_id    UUID  NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id   UUID  NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_card_labels_card_id   ON card_labels (card_id);
CREATE INDEX IF NOT EXISTS idx_card_labels_label_id  ON card_labels (label_id);
CREATE INDEX IF NOT EXISTS idx_labels_board_id       ON labels (board_id);
