# GitHub Essentials: Repos and PRs

## Lesson Overview
Hey Developers!

In this lesson, you'll learn the fundamentals of GitHub repositories and the pull request workflow. By the end, you'll create your own repository and submit a pull request as part of your assignment.

---

## Part 1: Understanding GitHub Repositories

### What is a Repository?
A repository (or "repo") is a storage space for your project. It contains all your project files, documentation, and the complete history of changes made to those files.

### Key Components of a Repository
- **README.md**: The front page of your repo, explaining what the project is about
- **Branches**: Parallel versions of your repository
- **Commits**: Snapshots of changes to your files
- **Issues**: Track bugs, enhancements, and tasks
- **.gitignore**: Specifies which files Git should ignore

---

## Part 2: Creating Your First Repository

### Step-by-Step Guide

1. **Create a New Repository**
   - Log in to GitHub
   - Click the **+** icon in the top-right corner
   - Select **New repository**
   - Fill in the repository details:
     - **Repository name**: Choose a descriptive name (e.g., `my-first-project`)
     - **Description**: Brief explanation of your project (optional)
     - **Public/Private**: Choose visibility
     - **Initialize with README**: ✓ Check this box
     - **Add .gitignore**: Select a template if needed
     - **Choose a license**: Optional, but recommended
   - Click **Create repository**

2. **Clone Your Repository Locally**

   ```bash
   # Copy the repository URL from GitHub
   git clone https://github.com/your-username/your-repo-name.git

   # Navigate into the repository
   cd your-repo-name
   ```

---

## Part 3: Understanding Pull Requests (PRs)

### What is a Pull Request?
A Pull Request is a method of submitting contributions to a project. It allows you to:
- Notify team members about changes you've made
- Request review of your code
- Discuss and refine changes before merging
- Maintain a clean main branch

### The PR Workflow
1. **Create a branch** → Make changes in isolation
2. **Make commits** → Save your changes with descriptive messages
3. **Push to GitHub** → Upload your branch
4. **Open a PR** → Request to merge your changes
5. **Review & Discussion** → Team reviews your code
6. **Merge** → Changes are integrated into the main branch

---

## Part 4: Creating Your First Pull Request

### Step 1: Create a New Branch

```bash
git checkout -b feature/add-introduction
# Or use the newer syntax
git switch -c feature/add-introduction
```

**Branch Naming Conventions**:
- `feature/description` - for new features
- `bugfix/description` - for bug fixes
- `docs/description` - for documentation changes

### Step 2: Make Changes

```bash
# Create a new file
echo "# My Introduction" > introduction.md
echo "Hello! I'm learning GitHub." >> introduction.md

# Or edit the README
echo "## New Section" >> README.md
```

### Step 3: Stage and Commit Your Changes

```bash
# Check what files have changed
git status

# Stage your changes
git add introduction.md
# Or stage all changes
git add .

# Commit with a descriptive message
git commit -m "Add introduction file with personal greeting"
```

**Good Commit Message Guidelines**:
- Use present tense: "Add feature" not "Added feature"
- Be descriptive but concise
- Explain what and why, not how

### Step 4: Push Your Branch to GitHub

```bash
git push origin feature/add-introduction
# If it's your first push, you might need
git push -u origin feature/add-introduction
```

### Step 5: Open a Pull Request on GitHub

- Go to your repository on GitHub
- You'll see a banner: **"Compare & pull request"** - click it
- Fill in the PR details:
  - **Title**: Clear, concise summary of changes
  - **Description**: Detailed explanation of:
    - What changes were made
    - Why these changes are necessary
    - Any relevant issue numbers (#123)
    - Screenshots (if applicable)
  - Select reviewers (if working in a team)
- Click **Create pull request**

### Example PR Description Template

```markdown
## Description
Brief overview of what this PR does.

## Changes Made
- Added introduction.md file
- Updated README with new section
- Fixed typo in main.py

## Why These Changes?
Explain the reasoning behind your changes.

## Screenshots (if applicable)
Add images showing your changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] I have tested my changes
- [ ] Documentation has been updated
```

---

## Part 5: PR Best Practices

### Do's
- ✓ Keep PRs small and focused on one thing
- ✓ Write clear, descriptive titles and descriptions
- ✓ Link related issues using #issue-number
- ✓ Test your code before submitting
- ✓ Respond to feedback professionally
- ✓ Update your PR based on review comments

### Don'ts
- ✗ Don't make huge PRs with many unrelated changes
- ✗ Don't submit untested code
- ✗ Don't take feedback personally
- ✗ Don't force push after someone has reviewed (without good reason)
- ✗ Don't forget to update documentation

---

# Assignment: Create Your Repository and Pull Request

## Requirements

### Part 1: Repository Creation
- Create a new GitHub repository named `github-practice-[your-name]`
- Initialize it with a README
- Add a `.gitignore` file (choose a template)
- Clone the repository to your local machine

### Part 2: Create a Pull Request
- Create a new branch called `feature/my-profile`
- Add a file called `profile.md` with:
  - Your name
  - Your interests
  - What you hope to learn from this course
  - A fun fact about yourself
- Make at least 2 commits with meaningful commit messages
- Push your branch to GitHub
- Create a pull request with:
  - Clear title
  - Detailed description
  - At least 3 bullet points in the description

### Part 3: Video Explanation
Create a 2-3 minute video explaining:
- Why you created the branch you did
- What changes you made and why
- How the PR workflow benefits collaborative development
- One challenge you faced and how you solved it

---

## Submission
Submit the following:
- **Pull Request URL**: Link to your PR on GitHub
- **Video File or Link**: Your explanation video (upload to YouTube, Loom, or similar)

---

## Useful Git Commands

```bash
# View commit history
git log --oneline

# View current branch
git branch

# Switch between branches
git checkout branch-name

# View remote repositories
git remote -v

# Pull latest changes from main
git pull origin main

# View differences before committing
git diff
```

---

## Resources

### Video Tutorials
- **GitHub Pull Request in 100 Seconds** - Quick overview
- **How to Create a Pull Request on GitHub** - Detailed walkthrough
- **Git and GitHub for Beginners** - Step-by-step tutorial

### Documentation
- GitHub Docs: About Pull Requests
- Git Documentation
- How to Write a Git Commit Message

### Practice Resources
- GitHub Skills - Interactive courses
- First Contributions - Practice tutorial

---

## Common Issues and Solutions

### Issue: "Permission denied" when pushing
**Solution**: Check your SSH keys or use HTTPS with credentials.

### Issue: Merge conflicts
**Solution**:
```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main
# Resolve conflicts in your editor, then:
git add .
git commit -m "Resolve merge conflicts"
```

### Issue: Need to undo a commit
**Solution**:
```bash
# Undo last commit but keep changes
git reset --soft HEAD~1

# Undo last commit and discard changes (careful!)
git reset --hard HEAD~1
```

---

Good luck with your assignment! Remember, making mistakes is part of learning. Don't be afraid to experiment and ask questions.
