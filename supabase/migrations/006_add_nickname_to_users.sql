-- Add nickname column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(255);

-- Create index for nickname
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

