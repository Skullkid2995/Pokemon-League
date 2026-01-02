-- Migration: Add player-specific game result fields
-- Run this in Supabase SQL Editor

-- Add player-specific result image and damage points fields
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS player1_result_image_url TEXT,
ADD COLUMN IF NOT EXISTS player2_result_image_url TEXT,
ADD COLUMN IF NOT EXISTS player1_damage_points INTEGER,
ADD COLUMN IF NOT EXISTS player2_damage_points INTEGER,
ADD COLUMN IF NOT EXISTS player1_winner_selection UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS player2_winner_selection UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add check constraints to ensure damage points are non-negative
ALTER TABLE games
DROP CONSTRAINT IF EXISTS check_player1_damage_points;

ALTER TABLE games
ADD CONSTRAINT check_player1_damage_points CHECK (player1_damage_points IS NULL OR player1_damage_points >= 0);

ALTER TABLE games
DROP CONSTRAINT IF EXISTS check_player2_damage_points;

ALTER TABLE games
ADD CONSTRAINT check_player2_damage_points CHECK (player2_damage_points IS NULL OR player2_damage_points >= 0);

