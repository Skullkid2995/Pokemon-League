-- Reorganize achievements system: Medals, Pokeballs, and Deck Types

-- First, drop the old player_deck_types if it exists (we'll recreate it better)
DROP TABLE IF EXISTS player_deck_types CASCADE;

-- Create Pokemon cards catalog table
CREATE TABLE IF NOT EXISTS pokemon_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id VARCHAR(100) UNIQUE NOT NULL, -- Official card ID from API
  name VARCHAR(255) NOT NULL,
  card_type VARCHAR(50) NOT NULL, -- fire, water, electric, etc.
  rarity VARCHAR(50), -- common, uncommon, rare, etc.
  hp INTEGER,
  image_url TEXT,
  image_url_small TEXT,
  set_name VARCHAR(255),
  set_id VARCHAR(100),
  card_number VARCHAR(50),
  artist VARCHAR(255),
  national_pokedex_number INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create improved player deck types table
CREATE TABLE IF NOT EXISTS player_deck_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_type VARCHAR(50) NOT NULL, -- fire, water, electric, etc.
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false, -- Current deck type being used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, deck_type, season_id)
);

-- Create badges/medals system
CREATE TABLE IF NOT EXISTS gym_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_type VARCHAR(50) UNIQUE NOT NULL, -- fire_badge, water_badge, etc.
  badge_name VARCHAR(255) NOT NULL, -- Boulder Badge, Cascade Badge, etc.
  badge_icon TEXT, -- SVG or image URL
  badge_color VARCHAR(50), -- For theming
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create player badges (which players have which badges)
CREATE TABLE IF NOT EXISTS player_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES gym_badges(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, badge_id, season_id)
);

-- Create pokeball types/achievements
CREATE TABLE IF NOT EXISTS pokeball_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pokeball_type VARCHAR(50) UNIQUE NOT NULL, -- master_ball, ultra_ball, great_ball, pokeball
  pokeball_name VARCHAR(255) NOT NULL,
  pokeball_icon TEXT, -- SVG or image URL
  description TEXT,
  requirement_type VARCHAR(50), -- total_wins, total_games, win_streak, etc.
  requirement_value INTEGER, -- Minimum value needed
  priority INTEGER DEFAULT 0, -- Higher = more prestigious
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create player pokeballs (which players have which pokeballs)
CREATE TABLE IF NOT EXISTS player_pokeballs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pokeball_id UUID NOT NULL REFERENCES pokeball_achievements(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_current BOOLEAN DEFAULT false, -- Display this pokeball
  UNIQUE(user_id, pokeball_id, season_id)
);

-- Add deck_type to games table to track what deck type was used
ALTER TABLE games
ADD COLUMN IF NOT EXISTS player1_deck_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS player2_deck_type VARCHAR(50);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pokemon_cards_card_type ON pokemon_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_pokemon_cards_card_id ON pokemon_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_player_deck_types_user_id ON player_deck_types(user_id);
CREATE INDEX IF NOT EXISTS idx_player_deck_types_deck_type ON player_deck_types(deck_type);
CREATE INDEX IF NOT EXISTS idx_player_deck_types_season_id ON player_deck_types(season_id);
CREATE INDEX IF NOT EXISTS idx_player_badges_user_id ON player_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_player_badges_season_id ON player_badges(season_id);
CREATE INDEX IF NOT EXISTS idx_player_pokeballs_user_id ON player_pokeballs(user_id);
CREATE INDEX IF NOT EXISTS idx_player_pokeballs_season_id ON player_pokeballs(season_id);
CREATE INDEX IF NOT EXISTS idx_games_player1_deck_type ON games(player1_deck_type);
CREATE INDEX IF NOT EXISTS idx_games_player2_deck_type ON games(player2_deck_type);

-- Insert default badges for each Pokemon type (using INSERT with conflict handling)
INSERT INTO gym_badges (badge_type, badge_name, badge_color, description)
SELECT * FROM (VALUES
  ('fire', 'Volcano Badge', 'red', 'Awarded to the Fire-type gym leader'),
  ('water', 'Cascade Badge', 'blue', 'Awarded to the Water-type gym leader'),
  ('electric', 'Bolt Badge', 'yellow', 'Awarded to the Electric-type gym leader'),
  ('grass', 'Earth Badge', 'green', 'Awarded to the Grass-type gym leader'),
  ('ice', 'Iceberg Badge', 'cyan', 'Awarded to the Ice-type gym leader'),
  ('fighting', 'Knuckle Badge', 'orange', 'Awarded to the Fighting-type gym leader'),
  ('poison', 'Soul Badge', 'purple', 'Awarded to the Poison-type gym leader'),
  ('ground', 'Quake Badge', 'amber', 'Awarded to the Ground-type gym leader'),
  ('flying', 'Feather Badge', 'sky', 'Awarded to the Flying-type gym leader'),
  ('psychic', 'Marsh Badge', 'pink', 'Awarded to the Psychic-type gym leader'),
  ('bug', 'Hive Badge', 'lime', 'Awarded to the Bug-type gym leader'),
  ('rock', 'Boulder Badge', 'stone', 'Awarded to the Rock-type gym leader'),
  ('ghost', 'Spooky Badge', 'indigo', 'Awarded to the Ghost-type gym leader'),
  ('dragon', 'Rising Badge', 'indigo', 'Awarded to the Dragon-type gym leader'),
  ('dark', 'Dusk Badge', 'gray', 'Awarded to the Dark-type gym leader'),
  ('steel', 'Mine Badge', 'gray', 'Awarded to the Steel-type gym leader'),
  ('fairy', 'Pixie Badge', 'pink', 'Awarded to the Fairy-type gym leader'),
  ('normal', 'Plain Badge', 'gray', 'Awarded to the Normal-type gym leader')
) AS v(badge_type, badge_name, badge_color, description)
WHERE NOT EXISTS (
  SELECT 1 FROM gym_badges WHERE gym_badges.badge_type = v.badge_type
);

-- Insert default pokeball achievements
INSERT INTO pokeball_achievements (pokeball_type, pokeball_name, requirement_type, requirement_value, priority, description)
SELECT * FROM (VALUES
  ('master_ball', 'Master Ball', 'top_player', 100, 100, 'The ultimate achievement - awarded to the player with the most total victories (100+ wins)'),
  ('ultra_ball', 'Ultra Ball', 'total_wins', 50, 80, 'Awarded for exceptional performance - 50+ victories'),
  ('great_ball', 'Great Ball', 'total_wins', 25, 60, 'Awarded for great performance - 25+ victories'),
  ('super_ball', 'Super Ball', 'total_wins', 10, 40, 'Awarded for good performance - 10+ victories'),
  ('pokeball', 'Poké Ball', 'total_games', 1, 20, 'Awarded for participating in your first game'),
  ('safari_ball', 'Safari Ball', 'win_streak', 5, 70, 'Awarded for a 5+ game win streak'),
  ('net_ball', 'Net Ball', 'type_wins', 10, 50, 'Awarded for 10+ victories with a specific type'),
  ('dive_ball', 'Dive Ball', 'type_wins', 5, 30, 'Awarded for 5+ victories with a specific type')
) AS v(pokeball_type, pokeball_name, requirement_type, requirement_value, priority, description)
WHERE NOT EXISTS (
  SELECT 1 FROM pokeball_achievements WHERE pokeball_achievements.pokeball_type = v.pokeball_type
);

COMMENT ON TABLE pokemon_cards IS 'Catalog of all Pokemon TCG cards';
COMMENT ON TABLE player_deck_types IS 'Tracks player victories and losses by Pokemon deck type per season';
COMMENT ON TABLE gym_badges IS 'Types of gym badges available (one per Pokemon type)';
COMMENT ON TABLE player_badges IS 'Tracks which players have earned which badges';
COMMENT ON TABLE pokeball_achievements IS 'Types of pokeball achievements and their requirements';
COMMENT ON TABLE player_pokeballs IS 'Tracks which players have earned which pokeball achievements';

