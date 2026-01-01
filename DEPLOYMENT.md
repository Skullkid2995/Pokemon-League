# Deployment Guide - Vercel + GitHub

This guide will help you deploy your Pokemon League app to Vercel and connect it to GitHub.

## Prerequisites

✅ You have a Vercel account
✅ You have a GitHub account
✅ Git is initialized in your project

## Step 1: Create GitHub Repository

1. Go to GitHub: https://github.com/new
2. Create a new repository:
   - **Repository name**: `pokemon-league` (or your preferred name)
   - **Description**: "Pokemon Trading Card Game League Score Tracker"
   - **Visibility**: Choose Private or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
3. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/pokemon-league.git

# Rename main branch if needed (Vercel prefers 'main')
git branch -M main

# Push your code to GitHub
git push -u origin main
```

**Note:** If you're using SSH instead of HTTPS, the URL will be:
```
git@github.com:YOUR_USERNAME/pokemon-league.git
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository:
   - Find and select `pokemon-league` from your repositories
   - Click "Import"
4. Configure the project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add the following:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://gyhqldjqjkotmbtnidta.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHFsZGpxamtvdG1idG5pZHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzk1NDcsImV4cCI6MjA4MjcxNTU0N30.WUZbH0_5N9z_Eu7s7RkNb9zHlEJjL88RdqdxL4kOxbc
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHFsZGpxamtvdG1idG5pZHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEzOTU0NywiZXhwIjoyMDgyNzE1NTQ3fQ.4yLLjtyAgJ7ljsFAbct69yOMQC8asnFsE89OuSwagSc
     ```
   - ⚠️ **Important**: For the `SUPABASE_SERVICE_ROLE_KEY`, you might want to add it only for Production environment, not Preview/Development
6. Click "Deploy"
7. Wait for deployment to complete (usually 1-2 minutes)

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked about environment variables, add them

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 4: Verify Deployment

After deployment:

1. Your app will be live at: `https://your-project-name.vercel.app`
2. Test the deployment:
   - Visit the URL
   - Try logging in
   - Verify all features work

## Step 5: Set Up Automatic Deployments

With GitHub connected, Vercel will automatically:
- ✅ Deploy when you push to `main` branch (Production)
- ✅ Create preview deployments for pull requests
- ✅ Deploy when you push to other branches (Preview)

## Important Notes

### Environment Variables Security

- ✅ `.env.local` is already in `.gitignore` (won't be committed)
- ✅ The `SUPABASE_SERVICE_ROLE_KEY` is sensitive - only add it in Vercel's environment variables, never commit it
- ⚠️ If you've already committed `.env.local` by accident, you should:
  1. Remove it from git: `git rm --cached .env.local`
  2. Commit the removal
  3. Push to GitHub
  4. Consider rotating your service role key in Supabase

### Database Setup

Make sure you've run all database migrations in Supabase before deploying:
- `001_initial_schema.sql`
- `002_add_auth_integration.sql`
- `003_add_roles.sql`

Or run the complete setup: `000_complete_setup.sql`

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Make sure all environment variables are set
- Verify `package.json` has all dependencies

### Environment Variables Not Working

- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding/updating environment variables
- Check that variables are set for the correct environment (Production/Preview/Development)

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check Supabase dashboard to ensure project is active
- Verify RLS policies allow connections from Vercel domain

## Next Steps

After deployment:
1. ✅ Update your Supabase RLS policies if needed for production domain
2. ✅ Test all functionality in production
3. ✅ Set up a custom domain (optional) in Vercel settings
4. ✅ Configure deployment notifications (optional)

Your app is now live! 🎉

