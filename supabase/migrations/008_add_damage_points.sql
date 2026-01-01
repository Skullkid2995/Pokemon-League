-- Add damage_points column to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS damage_points INTEGER;

-- Add check constraint to ensure damage_points is non-negative
ALTER TABLE games
DROP CONSTRAINT IF EXISTS check_damage_points;

ALTER TABLE games
ADD CONSTRAINT check_damage_points CHECK (damage_points IS NULL OR damage_points >= 0);

