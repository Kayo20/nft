-- Migration: Normalize gift codes and add normalized_code column with unique index
-- 1) Add normalized_code column (text)
-- 2) Populate normalized_code = upper(trim(code))
-- 3) Find duplicates and leave them for manual resolution — this migration will not auto-delete duplicates
-- 4) Add unique index on normalized_code to enforce uniqueness going forward

BEGIN;

-- Add new column
ALTER TABLE IF EXISTS gift_codes
  ADD COLUMN IF NOT EXISTS normalized_code TEXT;

-- Populate normalized_code
UPDATE gift_codes
SET normalized_code = upper(trim(code))
WHERE normalized_code IS NULL;

-- Create an index for faster lookup (do not create unique index if duplicates exist)
-- We will attempt to add a unique constraint, but only if duplicates are not present.

-- Count duplicates; if zero, create unique index
DO $$
DECLARE
  dup_count INT;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT normalized_code FROM gift_codes GROUP BY normalized_code HAVING count(*) > 1
  ) t;

  IF dup_count = 0 THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_codes_normalized_code_unique ON gift_codes(normalized_code)';
  ELSE
    RAISE NOTICE 'Found % duplicate normalized codes. Please resolve duplicates before enabling unique index.', dup_count;
  END IF;
END$$;

COMMIT;
