-- Add avatar_url column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile avatar image stored in Supabase Storage';



