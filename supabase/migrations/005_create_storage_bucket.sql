-- Create storage bucket for game result images
-- Note: This SQL needs to be run in Supabase SQL Editor
-- The bucket will be created through the Supabase Dashboard Storage section

-- You can create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage
-- 2. Click "New bucket"
-- 3. Name: game-results
-- 4. Public bucket: Yes (so images can be accessed)
-- 5. File size limit: 5242880 (5MB)
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Alternatively, you can use the Supabase Storage API to create it programmatically
-- For now, we'll just document it here

-- RLS Policies for storage (will be created when bucket is made)
-- These policies allow authenticated users to upload and read images

