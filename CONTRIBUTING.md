# Contributing to Emertech Certify

Thank you for your interest in contributing to **Emertech Certify: AI-Assisted Blockchain-Based Academic Certificate Verification System**.

This project is an open-source academic and research software system. We welcome contributions, bug reports, feature proposals, and academic improvements from students, researchers, and software engineers worldwide.

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful, constructive, and inclusive environment.
- Use welcoming and inclusive language.
- Be respectful of differing viewpoints and experiences.
- Gracefully accept constructive criticism.
- Focus on what is best for the project and the academic community.

---

## How Can I Contribute?

### 1. Reporting Bugs
Before creating a bug report, please check existing issues to ensure the issue has not already been reported. When submitting a bug report:
- Use a clear and descriptive issue title.
- Describe the exact steps to reproduce the problem.
- Include expected vs actual behavior.
- Provide environment details: Node.js version, OS, browser, commit hash.
- Attach terminal output or browser console logs (sanitize any private keys or credentials).

### 2. Proposing Features
Enhancement proposals should align with the project's core mission: academic credential integrity, decentralized trust, and cryptographic verifiability. Please describe:
- The problem your feature solves.
- The proposed architectural or smart contract modification.
- Potential impact on privacy (GDPR / DPDP) and blockchain gas costs.

### 3. Submitting Pull Requests

1. **Fork the Repository**:
   Create your feature branch from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Follow Coding Standards**:
   - Write clean, documented JavaScript/Solidity code.
   - Maintain existing docstrings and comments.
   - Use meaningful variable names (`studentRollNumber`, `certificateHash`).
   - Do NOT introduce dependencies with known critical security vulnerabilities.

3. **Verify Tests Pass Locally**:
   Every contribution must pass the test suite before submission:
   ```bash
   # Run smart contract tests
   npm run contracts:test

   # Run backend integration tests
   npm run backend:test

   # Verify frontend build
   CI=true npm run build
   ```

4. **Commit Guidelines**:
   Write conventional commit messages:
   - `feat: add zk-SNARK proof verification module`
   - `fix: resolve QR code boundary padding in pdf-lib`
   - `docs: update academic references and citation format`
   - `test: add edge cases for smart contract revocation`

5. **Security Invariant**:
   - **NEVER** commit private keys, mnemonic seed phrases, passwords, or live `.env` files.
   - Ensure `.gitignore` covers any new generated artifacts.

---

## Academic & Attribution Notice

As this project derives from the open-source **Certiport** repository, all contributions must preserve the upstream MIT license notice and comply with attribution requirements documented in [NOTICE.md](NOTICE.md).
