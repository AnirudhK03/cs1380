## Git and GitHub (Student Workflow)
Simple flow focused on working with the stencil and making clean commits.

### 1) Get the stencil
Clone the repo:
```bash
git clone https://github.com/brown-cs1380/stencil.git
cd stencil
```

Pull updates to the stencil:
```bash
git fetch origin
git merge origin/main
```

Pull updates while having some in-progress work:
```bash
git stash
git fetch origin
git merge origin/main
git stash pop
```

### 2) Work in small, atomic commits
Atomic commit = one idea or fix at a time.
```bash
git status
git add path/to/file.js
git commit -m "Implement local.routes.get error handling"
```

Tips:
- Avoid mixing unrelated changes in a single commit.
- Use clear, present-tense messages.

### 3) Check your changes
```bash
git diff
git diff --staged
```

### 4) Update from origin safely
```bash
git fetch origin
git merge origin/main
```

If you hit conflicts, fix them and then:
```bash
git add .
git commit
```

### 5) Push your work
```bash
git push origin main
```
