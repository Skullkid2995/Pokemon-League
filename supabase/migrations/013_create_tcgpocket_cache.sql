-- Create table to cache TCG Pocket data
CREATE TABLE IF NOT EXISTS tcgpocket_sets (
  id VARCHAR(50) PRIMARY KEY, -- Set ID from TCGdx API
  name TEXT NOT NULL,
  logo_url TEXT,
  card_count INTEGER,
  release_date DATE,
  series_id VARCHAR(50) DEFAULT 'tcgp',
  api_data JSONB, -- Store full API response for flexibility
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcgpocket_cards (
  id VARCHAR(50) PRIMARY KEY, -- Card ID from TCGdx API
  set_id VARCHAR(50) REFERENCES tcgpocket_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  rarity VARCHAR(50),
  api_data JSONB, -- Store full API response
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tcgpocket_sets_series_id ON tcgpocket_sets(series_id);
CREATE INDEX IF NOT EXISTS idx_tcgpocket_cards_set_id ON tcgpocket_cards(set_id);
CREATE INDEX IF NOT EXISTS idx_tcgpocket_sets_last_updated ON tcgpocket_sets(last_updated);
CREATE INDEX IF NOT EXISTS idx_tcgpocket_cards_last_updated ON tcgpocket_cards(last_updated);

-- Enable RLS
ALTER TABLE tcgpocket_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcgpocket_cards ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read cached data
CREATE POLICY "Authenticated users can read sets"
  ON tcgpocket_sets
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read cards"
  ON tcgpocket_cards
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only super admins can update cache (via server-side script)
-- For now, we'll use service role key in server actions
-- No policies needed for INSERT/UPDATE as they'll use service role

COMMENT ON TABLE tcgpocket_sets IS 'Cache for TCG Pocket sets/expansions from TCGdx API';
COMMENT ON TABLE tcgpocket_cards IS 'Cache for TCG Pocket cards from TCGdx API';



