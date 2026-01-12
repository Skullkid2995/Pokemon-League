-- Add game_code column to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS game_code TEXT;

-- Create unique index on game_code to ensure uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_game_code ON games(game_code) WHERE game_code IS NOT NULL;

-- Add index for active games lookup
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

COMMENT ON COLUMN games.game_code IS 'Unique 5-character code for game matching (alphanumeric)';

