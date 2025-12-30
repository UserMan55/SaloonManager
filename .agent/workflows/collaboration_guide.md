
# 🤝 GitHub Collaboration Workflow: Adding a Collaborator

Follow these steps to work on your shared SaloonManager repository with a friend.

### 1. Initialize Git & Push (If not already done)
If you haven't pushed your code to GitHub yet, run these commands in your terminal:

```bash
# 1. Initialize git (if not already a repo)
git init

# 2. Add all files
git add .

# 3. Commit your changes
git commit -m "Initial commit with Admin Dashboard & Tournaments"

# 4. Create a repo on GitHub (Go to https://github.com/new and create one)
# Then link it here (replace <YOUR_REPO_URL>):
git remote add origin <YOUR_REPO_URL>

# 5. Push to main branch
git branch -M main
git push -u origin main
```

### 2. Add Your Friend as a Collaborator
1. Go to your repository page on GitHub.
2. Click on **Settings** (top right tab).
3. On the left sidebar, click **Collaborators**.
4. Click **Add people**.
5. Type your friend's GitHub username or email and select them.
6. They will receive an email invitation. Once they accept, they can push/pull code.

### 3. Workflow for Working Together
To avoid conflicts, follow this simple rule: **"Pull before you Work, Push after you Commit."**

#### Your Friend (Initial Setup):
Your friend needs to clone the repo once:
```bash
git clone <YOUR_REPO_URL>
cd SaloonManager
npm install
npm run dev
```

#### Daily Workflow (Both of You):

**Step 1: Before starting work, get the latest changes**
```bash
git pull origin main
```

**Step 2: Make your changes/features**
(Edit files, create components, etc.)

**Step 3: Save and send your changes**
```bash
git add .
git commit -m "Added players page / Fixed bug"
git push origin main
```

### 📝 Tips
- **Communication:** Tell each other what file you are working on to avoid editing the same file at the same time.
- **Merge Conflicts:** If you both edit the same line, git will warn you. You'll have to manually choose which code to keep.
- **Branches (Optional but Recommended):** Ideally, create a branch for new features (e.g., `git checkout -b tournament-feature`), work there, push it, and merge it via a Pull Request on GitHub. This is safer than pushing directly to `main`.
