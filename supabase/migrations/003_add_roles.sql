-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'player' CHECK (role IN ('super_admin', 'player'));

-- Create index for role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'player' role (if any exist)
UPDATE users SET role = 'player' WHERE role IS NULL;


