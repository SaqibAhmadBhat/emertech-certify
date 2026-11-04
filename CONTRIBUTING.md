# Contributing to Emertech Certify

Thank you for your interest in contributing to **Emertech Certify**! This project is an academic software system engineered for decentralized academic certificate verification using Ethereum smart contracts and deterministic SHA-256 digests.

## Project Structure & Architecture Scope

- **`cleanroom/`**: The **primary, actively maintained v2.0 clean-room codebase**. All new features, bug fixes, smart contract enhancements, and optimizations must be targeted exclusively to files within `cleanroom/`.
- Root directories (`backend/`, `contracts/`, `frontend/`): Historical v1 implementation preserved for archival provenance. Do not submit functional PRs against historical directories.

## Development Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/emertech-certify.git
cd emertech-certify
```

### 2. Install Dependencies
```bash
# Contracts
cd cleanroom/contracts && npm install

# Backend
cd ../backend && npm install

# Frontend
cd ../frontend && npm install --legacy-peer-deps
```

### 3. Run Automated Validation
Before submitting any changes, verify that the complete test suite passes locally:
```bash
# Run Smart Contract Tests (14 passing)
cd cleanroom/contracts && npx hardhat test

# Run Backend Integration Tests (37 passing)
cd ../backend && npm test

# Run Frontend Production Build
cd ../frontend && CI=true npm run build
```

## Pull Request Guidelines

1. **Clean Commits**: Write clear, descriptive commit messages adhering to Conventional Commits (e.g. `feat(contracts): ...`, `fix(backend): ...`, `docs: ...`).
2. **Preserve Security Invariants**:
   - Never commit `.env` files or hardcode private keys.
   - Do not bypass authentication or role-based access controls.
   - Preserve existing MIT licenses and dual-scope attribution notices.
3. **Automated CI Validation**: All 52 automated validation checks must pass in GitHub Actions.
