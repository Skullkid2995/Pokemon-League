-- Complete Database Setup Script
-- Run this in Supabase SQL Editor to set up everything at once

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Players table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'upcoming'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CHECK (end_date >= start_date)
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  game_date DATE NOT NULL,
  game_time TIME,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CHECK (player1_id != player2_id),
  CHECK (player1_score >= 0 AND player2_score >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_season_id ON games(season_id);
CREATE INDEX IF NOT EXISTS idx_games_player1_id ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2_id ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_games_game_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_seasons_year ON seasons(year);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);

-- Add auth integration columns (migration 002)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- Create index for auth_user_id
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Add role column (migration 003)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'player' CHECK (role IN ('super_admin', 'player'));

-- Create index for role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'player' role (if any exist)
UPDATE users SET role = 'player' WHERE role IS NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access on users" ON users;
DROP POLICY IF EXISTS "Allow public insert access on users" ON users;
DROP POLICY IF EXISTS "Allow public update access on users" ON users;
DROP POLICY IF EXISTS "Allow public delete access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated read access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated update access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated delete access on users" ON users;

DROP POLICY IF EXISTS "Allow public read access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow public insert access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow public update access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow public delete access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow authenticated read access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow authenticated insert access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow authenticated update access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow authenticated delete access on seasons" ON seasons;

DROP POLICY IF EXISTS "Allow public read access on games" ON games;
DROP POLICY IF EXISTS "Allow public insert access on games" ON games;
DROP POLICY IF EXISTS "Allow public update access on games" ON games;
DROP POLICY IF EXISTS "Allow public delete access on games" ON games;
DROP POLICY IF EXISTS "Allow authenticated read access on games" ON games;
DROP POLICY IF EXISTS "Allow authenticated insert access on games" ON games;
DROP POLICY IF EXISTS "Allow authenticated update access on games" ON games;
DROP POLICY IF EXISTS "Allow authenticated delete access on games" ON games;

-- Create policies to require authentication
-- Users policies
CREATE POLICY "Allow authenticated read access on users" ON users 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert access on users" ON users 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update access on users" ON users 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete access on users" ON users 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Seasons policies
CREATE POLICY "Allow authenticated read access on seasons" ON seasons 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert access on seasons" ON seasons 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update access on seasons" ON seasons 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete access on seasons" ON seasons 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Games policies
CREATE POLICY "Allow authenticated read access on games" ON games 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert access on games" ON games 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update access on games" ON games 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete access on games" ON games 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_seasons_updated_at ON seasons;
DROP TRIGGER IF EXISTS update_games_updated_at ON games;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


