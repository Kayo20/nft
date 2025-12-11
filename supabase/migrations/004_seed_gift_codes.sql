-- Seed 100 OG gift codes in format OG-TREE-00001-XXXX through OG-TREE-00100-XXXX
-- Note: This is a data migration that generates codes with random suffixes
-- In production, ensure idempotency by using ON CONFLICT DO NOTHING

INSERT INTO gift_codes (code, created_by, claimed)
SELECT 
  'OG-TREE-' || LPAD(i::TEXT, 5, '0') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) AS code,
  'system' AS created_by,
  false AS claimed
FROM generate_series(1, 100) AS i
ON CONFLICT (code) DO NOTHING;
