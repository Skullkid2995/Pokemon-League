# Supabase Storage Setup for Game Result Images

You need to set up a storage bucket in Supabase to store game result images.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `game-results` (must match exactly)
   - **Public bucket**: ✅ **Yes** (so images can be accessed)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
6. Click **"Create bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. Go to **Storage** → **Policies**
2. Click on the `game-results` bucket
3. Click **"New Policy"**

### Policy 1: Allow authenticated users to upload images

1. Select **"Create a policy from scratch"** or use a template
2. Policy name: `Allow authenticated uploads`
3. Allowed operation: `INSERT`
4. Policy definition:
   ```sql
   (bucket_id = 'game-results'::text) AND (auth.role() = 'authenticated'::text)
   ```
5. Click **"Review"** then **"Save policy"**

### Policy 2: Allow authenticated users to read images

1. Select **"Create a policy from scratch"**
2. Policy name: `Allow authenticated reads`
3. Allowed operation: `SELECT`
4. Policy definition:
   ```sql
   (bucket_id = 'game-results'::text) AND (auth.role() = 'authenticated'::text)
   ```
5. Click **"Review"** then **"Save policy"**

### Policy 3: Allow authenticated users to update images (optional, for replacing)

1. Select **"Create a policy from scratch"**
2. Policy name: `Allow authenticated updates`
3. Allowed operation: `UPDATE`
4. Policy definition:
   ```sql
   (bucket_id = 'game-results'::text) AND (auth.role() = 'authenticated'::text)
   ```
5. Click **"Review"** then **"Save policy"**

## Step 3: Verify Setup

After setting up:
1. The bucket should be visible in Storage
2. Images uploaded through the app will appear here
3. You can view/delete images manually if needed

## Troubleshooting

### "Bucket not found" error
- Make sure the bucket name is exactly `game-results` (case-sensitive)
- Verify the bucket was created and is active

### "Access denied" error
- Check that RLS policies are set up correctly
- Verify you're logged in (authenticated)
- Make sure policies allow INSERT and SELECT operations

### Image upload fails
- Check file size (must be under 5MB)
- Verify file type is an image (jpeg, png, webp, gif)
- Check browser console for detailed error messages

