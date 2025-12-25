-- Migration: Make address columns case-insensitive and add normalization triggers
-- 1) Install citext extension
-- 2) Normalize existing values to lower-case
-- 3) Check for duplicates when lowercased and abort if found
-- 4) Alter columns to CITEXT
-- 5) Recreate foreign key where necessary
-- 6) Add triggers to ensure new/updated values are stored in lowercase

BEGIN;

-- 1) Ensure citext extension exists
CREATE EXTENSION IF NOT EXISTS citext;

-- 2) Normalize users.wallet_address to lowercase
UPDATE users SET wallet_address = lower(wallet_address) WHERE wallet_address IS NOT NULL;

-- 3) Abort if duplicates exist in users after lowercasing
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT wallet_address, COUNT(*) FROM users GROUP BY wallet_address HAVING COUNT(*) > 1
  ) t;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate wallet_address values found after lowercasing. Resolve duplicates before running this migration.';
  END IF;
END$$;

-- 4) Alter users.wallet_address to citext
ALTER TABLE users ALTER COLUMN wallet_address TYPE citext USING wallet_address::citext;

-- 5) Normalize nfts.owner_address and check duplicates
UPDATE nfts SET owner_address = lower(owner_address) WHERE owner_address IS NOT NULL;
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT lower(owner_address) AS addr, COUNT(*) FROM nfts GROUP BY lower(owner_address) HAVING COUNT(*) > 1
  ) t;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate nfts.owner_address values found after lowercasing. Resolve duplicates before running this migration.';
  END IF;
END$$;
ALTER TABLE nfts ALTER COLUMN owner_address TYPE citext USING owner_address::citext;

-- 6) Normalize lands.owner and check duplicates
UPDATE lands SET owner = lower(owner) WHERE owner IS NOT NULL;
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT lower(owner) AS o, COUNT(*) FROM lands GROUP BY lower(owner) HAVING COUNT(*) > 1
  ) t;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate lands.owner values found after lowercasing. Resolve duplicates before running this migration.';
  END IF;
END$$;

-- 7) Alter lands.owner to citext
ALTER TABLE lands ALTER COLUMN owner TYPE citext USING owner::citext;

-- 8) Recreate FK constraint lands(owner) -> users(wallet_address) to ensure types match
ALTER TABLE lands DROP CONSTRAINT IF EXISTS lands_owner_fkey;
ALTER TABLE lands ADD CONSTRAINT lands_owner_fkey FOREIGN KEY (owner) REFERENCES users(wallet_address) ON DELETE CASCADE;

-- 9) Add triggers to keep values lowercase on insert/update
-- Users wallet_address
CREATE OR REPLACE FUNCTION fn_users_normalize_wallet_address() RETURNS trigger AS $$
BEGIN
  IF NEW.wallet_address IS NOT NULL THEN
    NEW.wallet_address = lower(NEW.wallet_address);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_normalize_wallet_address ON users;
CREATE TRIGGER trg_users_normalize_wallet_address
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION fn_users_normalize_wallet_address();

-- Nfts owner_address
CREATE OR REPLACE FUNCTION fn_nfts_normalize_owner_address() RETURNS trigger AS $$
BEGIN
  IF NEW.owner_address IS NOT NULL THEN
    NEW.owner_address = lower(NEW.owner_address);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nfts_normalize_owner_address ON nfts;
CREATE TRIGGER trg_nfts_normalize_owner_address
BEFORE INSERT OR UPDATE ON nfts
FOR EACH ROW EXECUTE FUNCTION fn_nfts_normalize_owner_address();

-- Lands owner
CREATE OR REPLACE FUNCTION fn_lands_normalize_owner() RETURNS trigger AS $$
BEGIN
  IF NEW.owner IS NOT NULL THEN
    NEW.owner = lower(NEW.owner);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lands_normalize_owner ON lands;
CREATE TRIGGER trg_lands_normalize_owner
BEFORE INSERT OR UPDATE ON lands
FOR EACH ROW EXECUTE FUNCTION fn_lands_normalize_owner();

COMMIT;
