CREATE TABLE IF NOT EXISTS lands (
  id BIGSERIAL PRIMARY KEY,
  owner TEXT NOT NULL UNIQUE,
  season INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  slots INTEGER NOT NULL DEFAULT 9,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Land slots table for tracking which NFTs are planted in which slots
CREATE TABLE IF NOT EXISTS land_slots (
  id BIGSERIAL PRIMARY KEY,
  land_id BIGINT NOT NULL,
  slot_index INTEGER NOT NULL,
  nft_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(land_id, slot_index),
  FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_lands_owner ON lands(owner);
CREATE INDEX IF NOT EXISTS idx_land_slots_land_id ON land_slots(land_id);
CREATE INDEX IF NOT EXISTS idx_land_slots_nft_id ON land_slots(nft_id);

-- Add new columns to users table if they don't exist
-- (These would be added via ALTER if the table already exists)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS lastClaimAt TIMESTAMP;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS tfBalance NUMERIC DEFAULT 0;

-- Update nfts table to ensure all required columns exist
-- ALTER TABLE nfts ADD COLUMN IF NOT EXISTS lastFarmed TIMESTAMP;
-- ALTER TABLE nfts ADD COLUMN IF NOT EXISTS accumulatedRewards NUMERIC DEFAULT 0;
-- ALTER TABLE nfts ADD COLUMN IF NOT EXISTS currentBoostUntil TIMESTAMP;
-- ALTER TABLE nfts ADD COLUMN IF NOT EXISTS boostMultiplier NUMERIC DEFAULT 1.0;
