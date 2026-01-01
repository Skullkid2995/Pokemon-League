# GitHub Setup Guide

Follow these steps to connect your Pokemon League project to your existing GitHub account.

## Step 1: Create a New Repository on GitHub

1. Go to GitHub: https://github.com/new
2. Or click the "+" icon in the top right → "New repository"
3. Fill in the repository details:
   - **Repository name**: `pokemon-league` (or any name you prefer)
   - **Description**: "Pokemon Trading Card Game League Score Tracker"
   - **Visibility**: Choose **Private** or **Public** (your choice)
   - **⚠️ IMPORTANT**: 
     - ☐ **DO NOT** check "Add a README file"
     - ☐ **DO NOT** check "Add .gitignore" (we already have one)
     - ☐ **DO NOT** check "Choose a license"
   - Leave everything unchecked since we already have the files
4. Click **"Create repository"**

## Step 2: Connect Your Local Project to GitHub

After creating the repository, GitHub will show you instructions. Use these commands in your terminal:

### Option A: Using HTTPS (Recommended for beginners)

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/pokemon-league.git

# Rename branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

You'll be prompted for your GitHub username and password/token.

### Option B: Using SSH (If you have SSH keys set up)

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin git@github.com:YOUR_USERNAME/pokemon-league.git

# Rename branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## Step 3: Verify the Connection

1. Go to your GitHub repository page
2. You should see all your project files
3. Check that `.env.local` is **NOT** visible (it should be in .gitignore)

## Step 4: Next Steps

After your code is on GitHub, you can:
- ✅ Deploy to Vercel (see DEPLOYMENT.md)
- ✅ Continue development and push updates with `git push`

## Finding Your GitHub Username

If you're not sure of your GitHub username:
1. Go to https://github.com
2. Click your profile picture (top right)
3. Your username is in the dropdown menu or in your profile URL

## Troubleshooting

### Authentication Issues

If you get authentication errors:
- **HTTPS**: You may need to use a Personal Access Token instead of password
  - Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate a new token with `repo` permissions
  - Use this token as your password when pushing

### Branch Name Issues

If you get errors about branch names:
```bash
# Check current branch
git branch

# Rename to main if needed
git branch -M main
```

### Remote Already Exists

If you get "remote origin already exists":
```bash
# Remove existing remote
git remote remove origin

# Add it again with correct URL
git remote add origin https://github.com/YOUR_USERNAME/pokemon-league.git
```

