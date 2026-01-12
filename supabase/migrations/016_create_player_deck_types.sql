-- Create table to track player deck types and victories
CREATE TABLE IF NOT EXISTS player_deck_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_type VARCHAR(50) NOT NULL, -- e.g., 'fire', 'water', 'electric', etc.
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, deck_type, season_id)
);

CREATE INDEX IF NOT EXISTS idx_player_deck_types_user_id ON player_deck_types(user_id);
CREATE INDEX IF NOT EXISTS idx_player_deck_types_deck_type ON player_deck_types(deck_type);
CREATE INDEX IF NOT EXISTS idx_player_deck_types_season_id ON player_deck_types(season_id);

COMMENT ON TABLE player_deck_types IS 'Tracks player victories and losses by Pokemon deck type per season';
COMMENT ON COLUMN player_deck_types.deck_type IS 'Pokemon type used in the deck (fire, water, electric, etc.)';

