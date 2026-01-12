-- Add default_game_code column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS default_game_code TEXT;

COMMENT ON COLUMN users.default_game_code IS 'Default game/match code for quick sharing with friends';



