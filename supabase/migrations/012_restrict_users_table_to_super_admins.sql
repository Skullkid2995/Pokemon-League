-- Update RLS policies for users table - only super_admins can view all users
-- Use a SECURITY DEFINER function to avoid recursion in RLS policies

-- Create helper function to check if current user is super_admin
-- This function bypasses RLS (SECURITY DEFINER) to avoid recursion
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
  );
$$;

-- Function to search users by email (for adding friends)
-- Returns limited public info (id, name, email) for authenticated users
CREATE OR REPLACE FUNCTION search_user_by_email(search_email TEXT)
RETURNS TABLE(id UUID, name TEXT, email TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT u.id, u.name, u.email
  FROM users u
  WHERE u.email = search_email
  AND auth.uid() IS NOT NULL; -- Only authenticated users can search
$$;

-- Function to get list of users for game creation (public limited info)
-- Returns id, name, nickname for authenticated users
CREATE OR REPLACE FUNCTION get_users_for_game()
RETURNS TABLE(id UUID, name TEXT, nickname TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.nickname
  FROM users u
  WHERE auth.uid() IS NOT NULL
  ORDER BY u.name;
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated update access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated delete access on users" ON users;
DROP POLICY IF EXISTS "Super admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read their own record" ON users;
DROP POLICY IF EXISTS "Super admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can update records" ON users;
DROP POLICY IF EXISTS "Super admins can delete users" ON users;

-- Super admins can read all users
CREATE POLICY "Super admins can read all users"
  ON users
  FOR SELECT
  USING (is_super_admin());

-- Users can read their own user record (by auth_user_id)
CREATE POLICY "Users can read their own record"
  ON users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Super admins can insert users
CREATE POLICY "Super admins can insert users"
  ON users
  FOR INSERT
  WITH CHECK (is_super_admin());

-- Users can update their own record (for profile updates like avatar)
-- Super admins can update any user
CREATE POLICY "Users can update records"
  ON users
  FOR UPDATE
  USING (
    auth_user_id = auth.uid()
    OR is_super_admin()
  );

-- Only super admins can delete users
CREATE POLICY "Super admins can delete users"
  ON users
  FOR DELETE
  USING (is_super_admin());
