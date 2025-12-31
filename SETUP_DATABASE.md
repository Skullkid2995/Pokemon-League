# Quick Database Setup Guide

If you're getting the error "Could not find the table 'public.users'", you need to run the database migrations first.

## Quick Setup (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit: https://app.supabase.com
   - Select your project
   - Click on **SQL Editor** in the left sidebar

2. **Run the Complete Setup Script:**
   - Click **New Query**
   - Copy the entire contents of `supabase/migrations/000_complete_setup.sql`
   - Paste it into the SQL Editor
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)

This single script will create all tables, indexes, policies, and triggers you need.

## Verify Setup

After running the script, verify the tables were created:

1. Go to **Table Editor** in the left sidebar
2. You should see three tables:
   - ✅ `users` (with columns: id, name, email, auth_user_id, role, must_change_password, created_at, updated_at)
   - ✅ `seasons`
   - ✅ `games`

## Next Steps

After the database is set up:

1. **Create your admin user:**
   ```bash
   npm run create-admin
   ```

2. **Login:**
   - Go to http://localhost:3000/login
   - Use the credentials provided by the script

## Alternative: Run Migrations Individually

If you prefer to run migrations separately:

1. Run `001_initial_schema.sql` first
2. Then run `002_add_auth_integration.sql`
3. Finally run `003_add_roles.sql`

But the complete setup script (`000_complete_setup.sql`) does everything at once and is safer.


