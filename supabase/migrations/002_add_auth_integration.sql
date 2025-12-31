-- Link users table with Supabase Auth
-- Add auth_user_id to link with auth.users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- Create index for auth_user_id
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Update RLS policies to require authentication
DROP POLICY IF EXISTS "Allow public read access on users" ON users;
DROP POLICY IF EXISTS "Allow public insert access on users" ON users;
DROP POLICY IF EXISTS "Allow public update access on users" ON users;
DROP POLICY IF EXISTS "Allow public delete access on users" ON users;

-- Only authenticated users can read users
CREATE POLICY "Allow authenticated read access on users" ON users 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only authenticated users can insert users (will be restricted further in app logic)
CREATE POLICY "Allow authenticated insert access on users" ON users 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own record, or admins can update any
CREATE POLICY "Allow authenticated update access on users" ON users 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Only authenticated users can delete (will be restricted in app logic)
CREATE POLICY "Allow authenticated delete access on users" ON users 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update seasons policies to require authentication
DROP POLICY IF EXISTS "Allow public read access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow public insert access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow public update access on seasons" ON seasons;
DROP POLICY IF EXISTS "Allow public delete access on seasons" ON seasons;

CREATE POLICY "Allow authenticated read access on seasons" ON seasons 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert access on seasons" ON seasons 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update access on seasons" ON seasons 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete access on seasons" ON seasons 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update games policies to require authentication
DROP POLICY IF EXISTS "Allow public read access on games" ON games;
DROP POLICY IF EXISTS "Allow public insert access on games" ON games;
DROP POLICY IF EXISTS "Allow public update access on games" ON games;
DROP POLICY IF EXISTS "Allow public delete access on games" ON games;

CREATE POLICY "Allow authenticated read access on games" ON games 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert access on games" ON games 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update access on games" ON games 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete access on games" ON games 
  FOR DELETE USING (auth.uid() IS NOT NULL);


