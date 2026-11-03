# Emertech Certify — Clean Repository Separation & Export Strategy

**Document Version**: 1.0.0  
**Author**: Saqib Ahmad Bhat  
**Academic Affiliation**: Government College of Engineering, Tirunelveli  

---

## 1. Executive Summary & Purpose

Currently, **Emertech Certify** resides within a unified repository containing two evolutionary tiers:
1. **`cleanroom/`**: The primary, independently authored v2.0 clean-room implementation.
2. **Root (`/backend`, `/contracts`, `/frontend`)**: The historical v1.0 prototype adapted from Certiport (by Alwin James) with comprehensive security hardening and upstream attribution.

While keeping both in the same repository provides educational transparency and allows reviewers to compare the two architectures side-by-side, institutional reviewers or open-source publication standards may favor a **completely standalone GitHub repository** containing *only* the clean-room implementation with a fresh commit history.

This document details two sanctioned, non-destructive export strategies to extract `cleanroom/` into a new standalone repository (e.g., `https://github.com/SaqibAhmadBhat/emertech-certify-v2`) **without modifying, deleting, or force-pushing over the current repository history**.

---

## 2. Option A: Clean Directory Export & Fresh Git History (Recommended)

This method creates a brand new Git repository containing only the clean-room source files, documentation, and configuration, ensuring that the Git history contains zero legacy commits from upstream Certiport.

### Step-by-Step Export Procedure:

```bash
# 1. Create a clean temporary export directory outside the current repo
cd /Users/saqibahmadbhat/Desktop
mkdir emertech-certify-v2-export
cd emertech-certify-v2-export

# 2. Copy the entire cleanroom contents as the new repository root
cp -R /Users/saqibahmadbhat/Desktop/Certiport-main/cleanroom/* .
cp -R /Users/saqibahmadbhat/Desktop/Certiport-main/cleanroom/.* . 2>/dev/null || true

# 3. Remove any nested node_modules or build artifacts
find . -name "node_modules" -type d -prune -exec rm -rf {} +
find . -name "build" -type d -prune -exec rm -rf {} +
find . -name "artifacts" -type d -prune -exec rm -rf {} +
find . -name "cache" -type d -prune -exec rm -rf {} +

# 4. Copy project root presentation assets and documentation tools (if desired)
mkdir -p assets presentation
cp -R /Users/saqibahmadbhat/Desktop/Certiport-main/assets/* assets/ 2>/dev/null || true
cp -R /Users/saqibahmadbhat/Desktop/Certiport-main/presentation/* presentation/ 2>/dev/null || true

# 5. Initialize a fresh Git repository
git init -b main

# 6. Setup root .gitignore
cat << 'EOF' > .gitignore
node_modules/
build/
coverage/
.env
.env.local
*.log
artifacts/
cache/
storage/certificates/*
!storage/certificates/.gitkeep
*.traineddata
.DS_Store
EOF

# 7. Create root LICENSE and README
cp LICENSE . 2>/dev/null || cp docs/LICENSE . 2>/dev/null || true

# 8. Create GitHub Actions CI workflow
mkdir -p .github/workflows
cat << 'EOF' > .github/workflows/ci.yml
name: Emertech Certify v2.0 CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  contracts:
    name: Smart Contracts Test (Solidity ^0.8.20)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: contracts/package-lock.json
      - run: cd contracts && npm ci && npx hardhat test

  backend:
    name: Backend API Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci && node test/cleanroom.api.test.js

  frontend:
    name: Frontend Production Build (React 19)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci --legacy-peer-deps && CI=true npm run build
EOF

# 9. Initial Commit
git add .
git commit -m "feat: initial commit of Emertech Certify v2.0 clean-room architecture"

# 10. Link to new remote repository and push
git remote add origin https://github.com/SaqibAhmadBhat/emertech-certify-v2.git
git push -u origin main
```

---

## 3. Option B: Git Subtree Split (Preserving Clean-Room Commit History)

If you wish to retain the specific commits authored during the clean-room development while stripping away historical commits:

```bash
cd /Users/saqibahmadbhat/Desktop/Certiport-main

# 1. Create a detached branch containing only the cleanroom/ history
git subtree split --prefix=cleanroom -b v2-standalone-branch

# 2. Push this branch to a new standalone GitHub repository
git remote add v2-remote https://github.com/SaqibAhmadBhat/emertech-certify-v2.git
git push v2-remote v2-standalone-branch:main
```

---

## 4. Preservation & Licensing Summary

| Repository Element | Standalone v2.0 Repository | Current Unified Repository (`emertech-certify`) |
|---|---|---|
| **Primary Codebase** | `contracts/`, `backend/`, `frontend/` (former `cleanroom/*`) | `cleanroom/` (Primary) + root (Historical prototype) |
| **Commit History** | Fresh, 100% clean-room commit DAG | Full evolutionary history from upstream fork to clean-room |
| **Authorship** | Saqib Ahmad Bhat | Saqib Ahmad Bhat (v2) + Alwin James (v1 upstream base) |
| **Legal Notices** | MIT License (Saqib Ahmad Bhat) | MIT License + `NOTICE.md` attribution to Alwin James |
| **Status** | Independent standalone production release | Comprehensive portfolio & academic audit repository |

