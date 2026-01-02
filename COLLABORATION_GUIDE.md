# Collaboration Guide - Pokemon League

This guide will help you and your partner collaborate effectively on this project.

## Table of Contents
1. [Adding Your Partner as a Collaborator](#adding-your-partner-as-a-collaborator)
2. [Initial Setup for Your Partner](#initial-setup-for-your-partner)
3. [Branching Strategy](#branching-strategy)
4. [Daily Workflow](#daily-workflow)
5. [Merging Branches](#merging-branches)
6. [Resolving Conflicts](#resolving-conflicts)
7. [Best Practices](#best-practices)

---

## Adding Your Partner as a Collaborator

### Step 1: Add Collaborator on GitHub

1. Go to your repository on GitHub: `https://github.com/Skullkid2995/Pokemon-League`
2. Click on **Settings** (top right of the repository page)
3. In the left sidebar, click **Collaborators**
4. Click **Add people** button
5. Enter your partner's GitHub username or email
6. Click **Add [username] to this repository**
7. Your partner will receive an email invitation to collaborate

### Step 2: Partner Accepts Invitation

Your partner should:
1. Check their email for the invitation
2. Click the invitation link
3. Accept the collaboration invitation

---

## Initial Setup for Your Partner

Once your partner has accepted the invitation, they should run these commands:

```bash
# Clone the repository
git clone https://github.com/Skullkid2995/Pokemon-League.git
cd Pokemon-League

# Install dependencies
npm install

# Create their own branch (see branching strategy below)
git checkout -b partner-name/feature-branch

# Set up environment variables (if needed)
# Copy .env.example to .env and fill in the values
```

---

## Branching Strategy

### Main Branch (`main`)
- **Purpose**: Production-ready code only
- **Rule**: Never commit directly to `main`
- **Protection**: Should be protected (we'll set this up)

### Feature Branches
- **Naming**: `your-name/feature-description`
- **Examples**:
  - `john/add-user-authentication`
  - `jane/fix-date-display-bug`
  - `john/mobile-responsive-design`
- **Purpose**: Work on specific features or fixes
- **Lifecycle**: Created from `main`, merged back to `main` when complete

### Recommended Branch Structure

```
main (production)
├── john/feature-1
├── jane/feature-2
└── john/bugfix-1
```

---

## Daily Workflow

### Starting Work (Each Day)

```bash
# 1. Make sure you're on main branch
git checkout main

# 2. Pull latest changes from GitHub
git pull origin main

# 3. Create a new branch for your work
git checkout -b your-name/feature-description

# Example:
git checkout -b john/add-game-deletion
```

### During Development

```bash
# Make your changes to files...

# Stage your changes
git add .

# Or stage specific files
git add path/to/file.tsx

# Commit with a descriptive message
git commit -m "Add delete game functionality for super admins"

# Push your branch to GitHub
git push origin your-name/feature-description
```

### When Feature is Complete

1. **Push your final changes:**
   ```bash
   git push origin your-name/feature-description
   ```

2. **Create a Pull Request on GitHub:**
   - Go to your repository on GitHub
   - Click **Pull requests** tab
   - Click **New pull request**
   - Select your branch (`your-name/feature-description`)
   - Set base branch to `main`
   - Add description of changes
   - Click **Create pull request**

3. **Code Review:**
   - Partner reviews the code
   - Discuss any changes needed
   - Make updates if requested

4. **Merge the Pull Request:**
   - Once approved, click **Merge pull request**
   - Delete the branch after merging (GitHub will offer this option)

---

## Merging Branches

### Method 1: Merge via GitHub (Recommended)

This is the easiest and safest method:

1. **Create a Pull Request** (as described above)
2. **Review the changes** together
3. **Merge via GitHub UI:**
   - Click **Merge pull request**
   - Choose merge type:
     - **Create a merge commit** (recommended for feature branches)
     - **Squash and merge** (combines all commits into one)
     - **Rebase and merge** (linear history)
   - Click **Confirm merge**
   - Delete the branch

### Method 2: Merge Locally (Advanced)

If you need to merge locally:

```bash
# 1. Switch to main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Merge your partner's branch
git merge origin/partner-name/their-branch

# 4. Resolve any conflicts (see below)
# 5. Push to GitHub
git push origin main
```

### Method 3: Merge Your Own Branch

After your partner merges your PR, update your local main:

```bash
# Switch to main
git checkout main

# Pull the merged changes
git pull origin main

# Delete your local feature branch (optional cleanup)
git branch -d your-name/feature-description

# Delete remote branch (if not already deleted)
git push origin --delete your-name/feature-description
```

---

## Resolving Conflicts

### What are Conflicts?

Conflicts occur when both you and your partner modify the same lines of code in different branches.

### How to Resolve Conflicts

#### Option 1: Resolve via GitHub (Easier)

1. When creating a Pull Request, if there are conflicts, GitHub will show a warning
2. Click **Resolve conflicts** button
3. GitHub will show the conflicting files
4. Edit the files to resolve conflicts:
   - Look for conflict markers: `<<<<<<<`, `=======`, `>>>>>>>`
   - Choose which code to keep (or combine both)
   - Remove the conflict markers
5. Click **Mark as resolved**
6. Click **Commit merge**

#### Option 2: Resolve Locally (More Control)

```bash
# 1. Make sure you're on main and it's up to date
git checkout main
git pull origin main

# 2. Try to merge the branch
git merge origin/partner-name/their-branch

# 3. If conflicts occur, Git will tell you which files
# Example output:
# Auto-merging app/seasons/[id]/page.tsx
# CONFLICT (content): Merge conflict in app/seasons/[id]/page.tsx

# 4. Open the conflicted files in your editor
# Look for conflict markers:
<<<<<<< HEAD
// Your code (from main branch)
=======
// Partner's code (from their branch)
>>>>>>> partner-name/their-branch

# 5. Edit the file to resolve:
# - Keep your code
# - Keep partner's code
# - Combine both
# - Remove the conflict markers (<<<<<<<, =======, >>>>>>>)

# 6. Stage the resolved files
git add path/to/resolved-file.tsx

# 7. Complete the merge
git commit -m "Merge partner-name/their-branch and resolve conflicts"

# 8. Push to GitHub
git push origin main
```

### Conflict Resolution Tips

1. **Communicate**: Talk to your partner about the conflict
2. **Understand both changes**: Don't just delete one side
3. **Test after resolving**: Make sure the merged code works
4. **Keep it simple**: If unsure, ask your partner

---

## Best Practices

### 1. Commit Messages

Write clear, descriptive commit messages:

✅ **Good:**
```
"Add delete game functionality for super admins"
"Fix date display timezone issue"
"Add mobile responsive card view for games list"
```

❌ **Bad:**
```
"fix"
"update"
"changes"
```

### 2. Branch Naming

Use descriptive branch names:

✅ **Good:**
- `john/add-user-authentication`
- `jane/fix-date-bug`
- `john/mobile-responsive-design`

❌ **Bad:**
- `john/branch1`
- `test`
- `fix`

### 3. Pull Frequently

```bash
# Pull from main at least once a day
git checkout main
git pull origin main
```

### 4. Keep Branches Small

- One feature per branch
- Don't mix unrelated changes
- Easier to review and merge

### 5. Test Before Merging

- Test your changes locally
- Make sure the app runs without errors
- Check for linting errors: `npm run lint`

### 6. Communicate

- Let your partner know when you're working on something
- Discuss major changes before implementing
- Review each other's code

### 7. Don't Force Push to Main

```bash
# ❌ NEVER do this on main branch
git push --force origin main

# ✅ Always use pull requests
```

---

## Common Commands Cheat Sheet

```bash
# Check current branch
git branch

# Switch to main
git checkout main

# Create and switch to new branch
git checkout -b your-name/feature-name

# Pull latest changes
git pull origin main

# Stage all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push branch to GitHub
git push origin your-name/feature-name

# See what files changed
git status

# See commit history
git log

# See differences
git diff

# Discard local changes (be careful!)
git checkout -- filename
```

---

## Setting Up Branch Protection (Optional but Recommended)

To prevent accidental pushes to main:

1. Go to repository **Settings**
2. Click **Branches** in left sidebar
3. Under **Branch protection rules**, click **Add rule**
4. Branch name pattern: `main`
5. Check:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (set to 1)
6. Click **Create**

This ensures all changes to main go through pull requests.

---

## Quick Start Checklist for New Collaborator

- [ ] Accept GitHub collaboration invitation
- [ ] Clone the repository
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables
- [ ] Create first feature branch
- [ ] Make a test commit and push
- [ ] Create a test pull request
- [ ] Read this guide completely

---

## Need Help?

If you encounter issues:
1. Check this guide first
2. Search for the error message online
3. Ask your partner for help
4. Check Git documentation: https://git-scm.com/doc

---

## Example Workflow Session

Here's a complete example of a typical work session:

```bash
# Morning: Start fresh
git checkout main
git pull origin main

# Create feature branch
git checkout -b john/add-dark-mode

# Work on feature...
# (make changes to files)

# Stage and commit
git add .
git commit -m "Add dark mode toggle to navigation"

# Continue working...
git add components/Navigation.tsx
git commit -m "Fix dark mode persistence"

# End of day: Push to GitHub
git push origin john/add-dark-mode

# Create Pull Request on GitHub
# (go to GitHub website, create PR)

# Next day: After PR is merged
git checkout main
git pull origin main
git branch -d john/add-dark-mode  # Clean up local branch
```

---

Happy collaborating! 🚀

