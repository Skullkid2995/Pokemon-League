-- Make all existing users friends for testing purposes
-- This creates friendships between all users (unidirectional but works both ways in queries)

-- First, ensure we have at least 3 users
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count >= 2 THEN
        -- Insert friendships for all pairs of users
        INSERT INTO user_friends (user_id, friend_id, status)
        SELECT 
            u1.id as user_id,
            u2.id as friend_id,
            'accepted' as status
        FROM users u1
        CROSS JOIN users u2
        WHERE u1.id != u2.id
        AND NOT EXISTS (
            SELECT 1 
            FROM user_friends uf 
            WHERE uf.user_id = u1.id AND uf.friend_id = u2.id
        )
        ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted';
        
        RAISE NOTICE 'Created friendships for % users', user_count;
    ELSE
        RAISE NOTICE 'Not enough users to create friendships. Need at least 2, found %', user_count;
    END IF;
END $$;

