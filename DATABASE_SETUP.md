# Database Setup Instructions

This guide will help you set up the database tables in your Supabase project.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

## Step 2: Run the Initial Schema Migration

1. Open the SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

This will create:
- `users` table - Store player information
- `seasons` table - Store season/league information
- `games` table - Store game results and schedules
- All necessary indexes for performance
- Row Level Security (RLS) policies
- Triggers to auto-update timestamps

## Step 3: Run the Authentication Migration

**IMPORTANT:** You must also run the authentication migration:

1. In the SQL Editor, copy the contents of `supabase/migrations/002_add_auth_integration.sql`
2. Paste it into the SQL Editor
3. Click **Run**

This will:
- Link the `users` table with Supabase Auth
- Add `auth_user_id` and `must_change_password` columns
- Update RLS policies to require authentication

## Step 4: Verify Tables Were Created

1. Navigate to **Table Editor** in the left sidebar
2. You should see three tables:
   - `users` (with `auth_user_id` and `must_change_password` columns)
   - `seasons`
   - `games`

## Step 5: Set Up Authentication

After running the migrations, you need to set up authentication. See [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) for detailed instructions.

## Row Level Security (RLS)

The migrations set up RLS policies that require authentication for all operations. This ensures only logged-in users can access the data.

## That's It!

Once both migrations are run and authentication is set up, you can start using the application.

