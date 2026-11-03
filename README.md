# Emertech Certify — AI-Assisted Blockchain-Based Academic Certificate Verification System

A secure, self-contained academic credentialing and public verification platform designed for educational institutions, graduates, and verifiers.

Developed and customized as an academic engineering demonstration by **Saqib Ahmad Bhat** (Department of Computer Science and Engineering, **Government College of Engineering, Tirunelveli**).

---

## 1. Project Ownership, Attribution & Provenance

### Academic Context & Identity:
- **Developer & Maintainer**: Saqib Ahmad Bhat
- **Degree Program**: B.E. Computer Science and Engineering
- **Institution**: Government College of Engineering, Tirunelveli
- **Internship Context**: Academic demonstration in connection with an internship as an **AI and Blockchain Engineer Intern** at **Emertech Innovations Private Limited**.

### Upstream Attribution & Disclaimer:
This project is an advanced, customized, and significantly re-engineered fork based upon the open-source **Certiport** project by **Alwin James** ([https://github.com/J7-Alwin/Certiport](https://github.com/J7-Alwin/Certiport)), released under the permissive **MIT License**.

- **No False Authorship**: Saqib Ahmad Bhat does not claim to have originally authored the upstream baseline source code. Original copyright and license notices are preserved in full in the `LICENSE` file, and architectural provenance is documented in `NOTICE.md`.
- **Independent Academic Project**: This software is an independent educational engineering project developed for academic evaluation. It does not imply that Emertech Innovations Private Limited officially commissioned, owns, or commercially endorses this repository.

---

## 2. Distinction: Upstream Baseline vs. New Modifications

| Feature Area | Original Upstream Baseline (Certiport) | Newly Engineered in Emertech Certify |
|---|---|---|
| **Cryptographic Hashing** | ❌ No on-chain document hash | ✅ **256-bit SHA-256 (`bytes32`)** stored on-chain for tamper detection |
| **Certificate Revocation** | ❌ Non-existent in smart contract | ✅ **On-chain revocation** (`revokeCertificate`, `isRevoked`, events) |
| **Smart Contract Access Control**| ❌ Open to any arbitrary caller | ✅ **Role-based authorization** (`onlyAuthorized`, institution allowlist) |
| **Storage Architecture** | ❌ Hard dependency on Pinata (crashes if missing) | ✅ **Automated Local Storage Fallback** (runs offline with zero cost) |
| **Database Architecture** | ❌ Requires manual external MongoDB daemon | ✅ **Embedded In-Memory MongoDB Fallback** (zero-config startup) |
| **AI OCR Assistant** | ❌ None | ✅ **Local AI OCR engine** (Tesseract.js & PDF parser for field autofill) |
| **Public Verification Modes** | ❌ Single ID lookup against MongoDB | ✅ **Multi-Modal Verification** (ID, Binary PDF SHA-256 upload, QR code) |
| **Security Hardening** | 🔴 Leaked private key in `getAddress.js`, plaintext password logging | ✅ **Secrets eliminated**, bcrypt hashing, JWT route guards |
| **Frontend UI/UX** | Dark blue/black palette, raw emojis | ✅ **Modern Light Academic Theme** (Navy/Purple), Lucide icons, responsive |
| **Port Conflicts** | Crashed on macOS port 5000 (AirPlay conflict) | ✅ **Port 5001** isolated configuration |

---

## 3. Core Features

### 🏛️ 1. Educational Institution Portal
- Institutional registration queue with administrative approval.
- Dynamic certificate generation from academic EJS layouts.
- **AI-Assisted OCR Autofill**: Upload draft certificates or transcripts to automatically extract student names, registration numbers, degree titles, and dates.
- Interactive HTML preview modal prior to on-chain signing.
- On-chain certificate revocation with transparent reason logging.
- Complete issuance ledger with cryptographic SHA-256 digests.

### 🎓 2. Student Credential Dashboard
- Student account registration and institutional linkage.
- Comprehensive academic profile card.
- View issued certificates with real-time verification status badges (Authentic, Revoked).
- Download official tamper-evident PDF certificates containing embedded QR codes.
- One-click copy for immutable Blockchain Verification IDs.

### 🌐 3. Multi-Modal Public Verification Portal (Zero Login Required)
- **Mode 1 (Certificate ID)**: Instant lookup against the Ethereum blockchain registry.
- **Mode 2 (PDF Binary Upload)**: Upload any certificate PDF; the system computes its SHA-256 hash in real time and verifies it against the smart contract.
- **Mode 3 (QR Code Scanning)**: Verify directly from a smartphone camera or uploaded QR image.
- **Instant Tamper Detection**: If even a single character or grade in the PDF is altered, the system flags **TAMPERING DETECTED** and shows the hash mismatch.
- **Revocation Alerts**: Displays official revocation reasons and timestamps.

### 🤖 4. AI-Assisted Information Extraction (OCR Module)
- **Zero-Cost Local OCR**: Powered by Tesseract.js and PDF stream extraction running locally without external cloud API dependencies.
- **Administrative Field Pre-Fill**: Automatically parses student name, registration number, course title, and dates from draft certificates.
- **Human-in-the-Loop Verification**: Administrators can review and adjust extracted fields in the UI before committing to the immutable blockchain.
- **System Disclaimer**: Labeled explicitly as an administrative OCR extraction assistant, not an automated fraud detection mechanism or legal guarantee of authenticity.

### 🔐 5. Comprehensive Security & Privacy Controls
- Zero plaintext credentials or hardcoded private keys in source code.
- Bcrypt password hashing (10 salt rounds).
- Client-side route guards (`ProtectedRoute`) protecting administrative consoles.
- Sensitive student data (date of birth, phone, personal address) is strictly filtered out of public verification responses.

---

## 4. Technology Stack

- **Smart Contracts & Blockchain**: Solidity `^0.8.19`, Hardhat, Ethers.js v5
- **Backend REST API**: Node.js, Express.js, Mongoose 7
- **Database**: MongoDB with automatic embedded in-memory fallback (`mongodb-memory-server`)
- **Machine Learning & OCR**: Tesseract.js (Neural OCR), PDF-Parse
- **Document Engine**: Puppeteer (Headless Chromium), EJS Templates, QRCode, PDF-Lib
- **Frontend SPA**: React 19, React Router v6, Lucide React, Axios
- **Authentication**: JSON Web Tokens (JWT), Bcrypt.js

---

## 5. System Architecture

```
                                 [ Public Verifier / Student / Admin ]
                                                 |
                                                 v
                                    [ React 19 Single Page App ]
                                                 |
                                     (JWT Authenticated REST)
                                                 v
                                   [ Node.js / Express API Gateway ]
                                                 |
                  +------------------------------+-------------------------------+
                  |                              |                               |
                  v                              v                               v
         [ AI OCR Engine ]            [ Document & Storage ]            [ Solidity Contract ]
      - Tesseract.js Neural         - Puppeteer PDF Renderer        - CertificateRegistry.sol
      - Stream Text Extractor       - SHA-256 Digest Engine         - bytes32 Document Hash
      - Regex Field Classifier      - Local Fallback / IPFS         - Hardhat / Sepolia EVM
```

---

## 6. Quick Installation and Execution

### Step 1: Install Dependencies
```bash
# Contracts
cd contracts && npm install

# Backend
cd ../backend && npm install

# Frontend
cd ../frontend/certiport-frontend && npm install --legacy-peer-deps

# Return to root
cd ../..
```

### Step 2: Run All Tests (Solidity + Backend APIs + AI OCR)
```bash
npm run test:all
```
*Executes all 9 smart contract tests and all 15 backend API and AI OCR tests.*

### Step 3: Start Services

#### Terminal 1 — Blockchain & Backend:
```bash
cd backend
npm start
```
*Initializes on port 5001 with automatic embedded in-memory MongoDB.*

#### Terminal 2 — Frontend:
```bash
cd frontend/certiport-frontend
npm start
```
*Launches the React application at `http://localhost:3000`.*

---

## 7. Demonstration Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **System Admin** | `admin@emertech.local` | `admin123` | Institutional approvals, global audit, OCR lab |
| **University** | `vc@gce-tveli.edu.in` | `UniversitySecret123` | Certificate issuance, AI autofill, revocation |
| **Student** | `saqib.student@gce.edu.in` | `StudentSecurePassword123` | View certificates, download PDF, copy ID |

---

## 8. Complete Project Documentation Index

- [PROJECT_AUDIT.md](PROJECT_AUDIT.md): Initial comprehensive technical audit of the upstream Certiport codebase.
- [ARCHITECTURE.md](ARCHITECTURE.md): Multi-tier architectural specifications, data flows, and storage mechanics.
- [SETUP.md](SETUP.md): Step-by-step setup guide for macOS, Linux, and Windows.
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md): Full REST API endpoint reference and JSON payload contracts.
- [SMART_CONTRACTS.md](SMART_CONTRACTS.md): Detailed Solidity `CertificateRegistry.sol` documentation and event specs.
- [TESTING.md](TESTING.md): Test execution commands, terminal outputs, and test coverage evidence.
- [SECURITY.md](SECURITY.md): Vulnerability disclosures, remediation reports, and security best practices.
- [NOTICE.md](NOTICE.md): Upstream attribution notices, MIT copyright statements, and disclaimers.

---

## 9. Current Limitations & Future Roadmap

1. **OCR Field Confidence**: The AI OCR feature uses regex heuristic matching on extracted text. Handwritten signatures and low-resolution scans require manual verification by the administrator.
2. **Local Hardhat Network**: For academic demonstration, transactions are executed against the local Hardhat EVM (Chain ID 31337). Production deployment requires configuring real testnet ETH on Sepolia or Polygon Amoy.
3. **Decentralized Storage**: Local fallback is used when Pinata IPFS keys are unconfigured. In full production, multi-node IPFS clustering or Filecoin pinning would be recommended.

---

## 10. License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md) files for complete details.
