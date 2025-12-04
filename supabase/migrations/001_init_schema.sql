-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  profile JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Create nonces table for SIWE
CREATE TABLE IF NOT EXISTS nonces (
  address TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nonces_created_at ON nonces(created_at);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(18, 6) DEFAULT 0,
  image_url TEXT,
  type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id SERIAL PRIMARY KEY,
  owner_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  rarity TEXT DEFAULT 'uncommon',
  level INT DEFAULT 1,
  power INT DEFAULT 0,
  daily_yield NUMERIC(18, 6) DEFAULT 0,
  health INT DEFAULT 100,
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfts_owner_address ON nfts(owner_address);
CREATE INDEX IF NOT EXISTS idx_nfts_status ON nfts(status);

-- Create inventories table
CREATE TABLE IF NOT EXISTS inventories (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  qty INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventories_user_item ON inventories(user_id, item_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC(18, 6),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Create fusion_history table
CREATE TABLE IF NOT EXISTS fusion_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  input_nft_ids JSONB,
  result_nft_id INT REFERENCES nfts(id) ON DELETE SET NULL,
  cost NUMERIC(18, 6) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fusion_history_user_id ON fusion_history(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table (allow everyone to read, users can update their own)
CREATE POLICY "Allow public read on users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON users
  FOR UPDATE USING (wallet_address = CURRENT_USER);

-- RLS Policies for nfts table (allow everyone to read, owner can update)
CREATE POLICY "Allow public read on nfts" ON nfts
  FOR SELECT USING (true);

CREATE POLICY "Allow owner to update nft" ON nfts
  FOR UPDATE USING (owner_address = CURRENT_USER);

CREATE POLICY "Allow owner to delete nft" ON nfts
  FOR DELETE USING (owner_address = CURRENT_USER);

-- RLS Policies for inventories (user can only see own inventory)
CREATE POLICY "Allow user to read own inventory" ON inventories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow user to update own inventory" ON inventories
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for transactions (user can only see own transactions)
CREATE POLICY "Allow user to read own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for items (public read only)
CREATE POLICY "Allow public read on items" ON items
  FOR SELECT USING (true);

-- Insert sample items
INSERT INTO items (id, name, description, price, type) VALUES
  ('water', 'Pure Water Bundle', '10 units, 4 hours duration', 10, 'farming'),
  ('fertilizer', 'Fertilizer Bundle', '10 units, 4 hours duration', 10, 'farming'),
  ('antiBug', 'Anti Bug Bundle', '10 units, 4 hours duration', 10, 'farming')
ON CONFLICT (id) DO NOTHING;

-- Create seasons table for Season 0 tracking
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  season_number INT UNIQUE NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasons_season_number ON seasons(season_number);

-- Create farming_state table for tracking NFT farming status
-- All 3 items must be active for farming to generate rewards
CREATE TABLE IF NOT EXISTS farming_state (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nft_id INT REFERENCES nfts(id) ON DELETE CASCADE,
  nft_rarity TEXT NOT NULL,
  farming_started TIMESTAMP DEFAULT NOW(),
  active_items JSONB DEFAULT '[]'::JSONB, -- Array of {itemId, expiresAt} objects
  last_claimed_at TIMESTAMP DEFAULT NOW(),
  accumulated_rewards NUMERIC(18, 6) DEFAULT 0,
  is_farming_active BOOLEAN DEFAULT false, -- true if all 3 items are active
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_farming_state_user_nft ON farming_state(user_id, nft_id);
CREATE INDEX IF NOT EXISTS idx_farming_state_user_id ON farming_state(user_id);
CREATE INDEX IF NOT EXISTS idx_farming_state_is_active ON farming_state(is_farming_active);

-- Create claim_history table for tracking claims and rewards
CREATE TABLE IF NOT EXISTS claim_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nft_id INT REFERENCES nfts(id) ON DELETE CASCADE,
  season_number INT REFERENCES seasons(season_number),
  gross_rewards NUMERIC(18, 6) NOT NULL,
  fee_percentage INT NOT NULL,
  net_rewards NUMERIC(18, 6) NOT NULL,
  claimed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_history_user_id ON claim_history(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_history_nft_id ON claim_history(nft_id);
CREATE INDEX IF NOT EXISTS idx_claim_history_season ON claim_history(season_number);

-- Enable RLS for new tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE farming_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seasons (public read only)
CREATE POLICY "Allow public read on seasons" ON seasons
  FOR SELECT USING (true);

-- RLS Policies for farming_state (user can only see own farming state)
CREATE POLICY "Allow user to read own farming state" ON farming_state
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow user to update own farming state" ON farming_state
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for claim_history (user can only see own claims)
CREATE POLICY "Allow user to read own claim history" ON claim_history
  FOR SELECT USING (user_id = auth.uid());

-- Insert Season 0 (10-day season starting Dec 15, 2024)
INSERT INTO seasons (season_number, start_date, end_date, description) VALUES
  (0, '2024-12-15T00:00:00Z', '2024-12-25T00:00:00Z', 'Season 0: 10-day TreeFi launch season')
ON CONFLICT (season_number) DO NOTHING;
