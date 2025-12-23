-- Migration: migrate gift_code_claims into transactions (if present) and drop the table
BEGIN;

-- Migrate existing gift_code_claims rows into transactions, preserving claimed_at and claimer
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gift_code_claims') THEN
    INSERT INTO transactions (user_id, type, amount, metadata, created_at)
    SELECT u.id, 'gift_claim', 0, jsonb_build_object('gift_code_id', gcc.gift_code_id, 'claimer', gcc.claimer, 'metadata', gcc.metadata), gcc.claimed_at
    FROM gift_code_claims gcc
    LEFT JOIN users u ON u.wallet_address = gcc.claimer;
  END IF;
END$$;

-- Drop the claims table (we now record claims in transactions)
DROP TABLE IF EXISTS gift_code_claims;

COMMIT;