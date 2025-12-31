# Authentication Setup Guide

This guide explains how to set up authentication for the Pokemon League app.

## Overview

The app now requires authentication. Users are created by admins with temporary passwords, and users must change their password on first login.

## Step 1: Run Database Migration

Run the authentication migration in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run `supabase/migrations/002_add_auth_integration.sql`

This migration:
- Links the `users` table with Supabase Auth
- Adds `auth_user_id` and `must_change_password` fields
- Updates RLS policies to require authentication

## Step 2: Configure Supabase Auth Settings

### Option A: Using Service Role Key (Recommended for Production)

1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (keep this secret!)
3. Add it to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

**Benefits:**
- Bypasses email confirmation
- Can create users without sending confirmation emails
- Full admin control

### Option B: Using Anon Key (For Development)

If you don't want to use the service role key:

1. Go to Supabase Dashboard → Authentication → Settings
2. Disable **"Enable email confirmations"** (for development only)
3. The app will use the anon key with `signUp()` instead

**Note:** This approach will still try to send emails, so it's better for development.

## Step 3: Create Your First Admin User

Since all routes are now protected, you need to create your first admin user:

### Method 1: Using Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and a temporary password
4. Make sure "Auto Confirm User" is checked
5. After creating, you'll need to manually create a record in the `users` table

### Method 2: Using SQL (Quick Setup)

Run this SQL in Supabase SQL Editor (replace with your email and password):

```sql
-- Create auth user (replace email and password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',  -- Change this
  crypt('TempPassword123!', gen_salt('bf')),  -- Change this
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  '',
  '',
  '',
  ''
) RETURNING id;

-- Then create the users table record (use the id from above)
INSERT INTO users (name, email, auth_user_id, must_change_password)
VALUES ('Admin User', 'admin@example.com', 'PASTE_ID_FROM_ABOVE', false);
```

## Step 4: Temporary Password Options

When creating users, you can choose from 4 password generation options:

1. **Random Secure** (Recommended)
   - Cryptographically secure random password
   - Example: `Kx9#mP2$vL8@`

2. **Simple Pattern**
   - Easy to remember pattern
   - Example: `Temp1234!Pokemon`

3. **Name-Based**
   - Uses the user's name + year + random number
   - Example: `John2024!123`

4. **Pattern-Based**
   - Uses a pattern with year
   - Example: `Poke2024!123`

## Step 5: User Flow

1. **Admin creates user:**
   - Admin fills out user form with name and email
   - Selects password generation type
   - System generates temporary password
   - Admin saves/copies the temporary password
   - Admin shares credentials with the user

2. **User first login:**
   - User logs in with email and temporary password
   - System detects `must_change_password` flag
   - User is redirected to change password page
   - User sets new password
   - User can now access the app

3. **Subsequent logins:**
   - User logs in with email and their chosen password
   - Access granted immediately

## Security Notes

- Service role key should NEVER be exposed to the client
- Keep service role key in `.env.local` (already in `.gitignore`)
- Temporary passwords should be shared securely
- Users should change passwords immediately
- Consider implementing password expiration policies

## Troubleshooting

### "User already exists" error
- The email is already registered in Supabase Auth
- Either use a different email or reset the user's password in Supabase Dashboard

### Email confirmation required
- Make sure email confirmations are disabled OR service role key is configured
- Check Supabase Authentication settings

### Can't create users
- Verify you're logged in as an admin
- Check that RLS policies are correct
- Verify service role key is set (if using Option A)

### Password change not working
- Ensure user is authenticated
- Check that password meets requirements (8+ chars, uppercase, lowercase, number, special char)


