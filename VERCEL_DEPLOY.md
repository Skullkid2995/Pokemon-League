# Quick Vercel Deployment Guide

Your code is now on GitHub at: https://github.com/Skullkid2995/Pokemon-League

## Deploy to Vercel (5 Steps)

### Step 1: Go to Vercel Dashboard
Visit: https://vercel.com/dashboard

### Step 2: Import Your Repository
1. Click **"Add New..."** → **"Project"**
2. You should see **"Pokemon-League"** in your repositories
   - If not, click **"Adjust GitHub App Permissions"** and grant access
3. Click **"Import"** next to Pokemon-League

### Step 3: Configure Project
- **Framework Preset**: Next.js (should auto-detect) ✅
- **Root Directory**: `./` (default) ✅
- **Build Command**: `npm run build` (default) ✅
- **Output Directory**: `.next` (default) ✅

**Click "Next"**

### Step 4: Add Environment Variables ⚠️ IMPORTANT
Click **"Environment Variables"** and add these three:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://gyhqldjqjkotmbtnidta.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHFsZGpxamtvdG1idG5pZHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzk1NDcsImV4cCI6MjA4MjcxNTU0N30.WUZbH0_5N9z_Eu7s7RkNb9zHlEJjL88RdqdxL4kOxbc`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHFsZGpxamtvdG1idG5pZHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEzOTU0NywiZXhwIjoyMDgyNzE1NTQ3fQ.4yLLjtyAgJ7ljsFAbct69yOMQC8asnFsE89OuSwagSc`
   - Environments: ✅ Production only (for security)

**Click "Deploy"**

### Step 5: Wait and Test
- Deployment takes 1-2 minutes
- You'll get a live URL like: `https://pokemon-league-xxxxx.vercel.app`
- Click the URL to visit your live app!

## ✅ Automatic Deployments

After this initial deployment:
- ✅ Every push to `main` branch = Automatic production deployment
- ✅ Every pull request = Automatic preview deployment
- ✅ No need to redeploy manually!

## 🎉 You're Done!

Your Pokemon League app is now live on Vercel!

