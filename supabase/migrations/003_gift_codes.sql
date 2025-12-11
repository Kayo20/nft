-- Gift codes table: stores generated codes and metadata
CREATE TABLE IF NOT EXISTS gift_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT,
  claimed BOOLEAN DEFAULT false,
  claimed_by TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Optional table to track claims separately (audit)
CREATE TABLE IF NOT EXISTS gift_code_claims (
  id BIGSERIAL PRIMARY KEY,
  gift_code_id BIGINT REFERENCES gift_codes(id) ON DELETE CASCADE,
  claimer TEXT NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_codes_claimed ON gift_codes(claimed);
