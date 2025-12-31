# Create Super Admin User Guide

This guide will help you create your first super admin user: **Jesus Contreras Maldonado** (skullkid2995@gmail.com)

## Prerequisites

1. ✅ Run all database migrations (001, 002, and 003)
2. ✅ Add service role key to `.env.local`

## Step 1: Add Service Role Key

1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (⚠️ Keep this secret!)
3. Add it to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## Step 2: Run the Admin Creation Script

Run this command in your terminal:

```bash
npm run create-admin
```

This will:
- Create the auth user in Supabase
- Create the user record with super_admin role
- Generate a secure random password
- Display the password for you to save

## Alternative: Manual Setup

If the script doesn't work, you can create the user manually:

### Option 1: Using Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter:
   - Email: `skullkid2995@gmail.com`
   - Password: (generate a secure password, save it!)
   - Auto Confirm User: ✅ Checked
4. Click "Create User"
5. Copy the User ID from the user list
6. Go to SQL Editor and run:

```sql
INSERT INTO users (name, email, auth_user_id, role, must_change_password)
VALUES (
  'Jesus Contreras Maldonado',
  'skullkid2995@gmail.com',
  'PASTE_USER_ID_FROM_STEP_5',
  'super_admin',
  false
);
```

### Option 2: Generate Password First

If you want to use the password generator:

1. Run the app: `npm run dev`
2. The password generation is in `lib/utils/password.ts`
3. You can test it in the browser console or create a simple test script

## Step 3: Login

Once the user is created:

1. Go to: http://localhost:3000/login
2. Enter your email: `skullkid2995@gmail.com`
3. Enter the password that was generated/created
4. You should now be logged in as a Super Admin!

## Password

The script generates a secure random 16-character password. It will be displayed when you run:

```bash
npm run create-admin
```

**Important:** Save this password securely! You'll need it to login.

## Troubleshooting

### "Service role key not set"
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Restart your dev server after adding it

### "User already exists"
- The script will detect if the user exists
- If it exists in Auth but not in users table, it will create the users table record
- You may need to reset the password in Supabase Dashboard

### "Migration not run"
- Make sure you've run migration `003_add_roles.sql`
- Check that the `users` table has a `role` column


