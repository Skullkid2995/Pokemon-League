-- Create user_friends table for friend relationships
CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id) -- Prevent users from friending themselves
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);

-- Enable RLS
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own friendships
CREATE POLICY "Users can view their own friendships"
  ON user_friends
  FOR SELECT
  USING (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
  ) OR auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = friend_id
  ));

-- Users can create friend requests
CREATE POLICY "Users can create friend requests"
  ON user_friends
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
  ));

-- Users can update their own friend requests/status
CREATE POLICY "Users can update their own friend requests"
  ON user_friends
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
  ) OR auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = friend_id
  ));

-- Add comment
COMMENT ON TABLE user_friends IS 'Stores friend relationships between users';
COMMENT ON COLUMN user_friends.status IS 'pending: friend request sent, accepted: friendship confirmed, blocked: user blocked';



