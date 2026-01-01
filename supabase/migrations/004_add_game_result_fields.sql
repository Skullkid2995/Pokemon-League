-- Add winner and image fields to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS result_image_url TEXT;

-- Create index for winner_id
CREATE INDEX IF NOT EXISTS idx_games_winner_id ON games(winner_id);

-- Update the check constraint to allow winner to be one of the players
-- (We'll enforce this in application logic, but we can add a check if needed)

