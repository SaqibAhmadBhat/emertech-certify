# Changelog

All notable changes to **Emertech Certify** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-03

### Architectural Transformation & Re-Engineering Milestone
Transformed upstream open-source baseline (**Certiport** by Alwin James) into **Emertech Certify: AI-Assisted Blockchain-Based Academic Certificate Verification System**.

### Added
- **Multi-Modal Verification Engine**:
  - Implemented 4 distinct verification entryways in frontend (`/verify`):
    1. Direct PDF binary drag-and-drop with browser-side SHA-256 computation.
    2. 64-character hexadecimal SHA-256 hash input field with real-time format validation.
    3. Live HTML5 webcam and static image QR code scanner via `html5-qrcode`.
    4. Client-side OCR text extraction engine using `tesseract.js` Web Workers for physical certificate scans.
- **Smart Contract Enhancements (`CertificateRegistry.sol`)**:
  - Direct 256-bit cryptographic digest tracking (`bytes32 certHash`).
  - On-chain certificate revocation protocol (`revokeCertificate(bytes32)`).
  - Explicit querying methods: `isRevoked(bytes32)`, `verifyCertificateHash(bytes32)`.
  - OpenZeppelin `ReentrancyGuard` integration for re-entrancy attack immunity.
  - Complete Hardhat automated test suite with 9/9 passing tests.
- **Dynamic PDF & QR Synthesis**:
  - Integrated `pdf-lib` and `qrcode` to dynamically compile vector PDFs with high-resolution seals, institution typography, and embedded verification QR codes.
- **Dual-Layer Verification Diagnostic**:
  - Comprehensive match diagnostic comparing calculated document hash against on-chain Ethereum state.
  - Instant visual alerts: `VERIFIED AUTHENTIC` (green), `TAMPER DETECTED` (red), `CERTIFICATE REVOKED` (yellow).
- **Decentralized & Local Fallback Storage**:
  - Built resilient storage adapter supporting live IPFS pinning via Pinata SDK or zero-cost local filesystem fallback when credentials are not configured.
- **Interactive Presentation Website**:
  - Standalone, zero-build presentation portal in `presentation/index.html` featuring 8 structured sections, interactive workflow stepper, screenshot gallery, and keyboard navigation.
- **Automated CI/CD Pipeline**:
  - Authored GitHub Actions workflow (`.github/workflows/ci.yml`) covering contracts test suite, backend integration tests, and frontend production build.
- **Comprehensive Documentation Suite**:
  - Created `STUDENT_VIVA_GUIDE.md` (elevator pitch, 5-minute viva demonstration script, 20 professor Q&As).
  - Created `CITATION.cff`, `REFERENCES.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, and updated `NOTICE.md`.

### Changed
- **Frontend Architecture & UX**:
  - Upgraded styling to Tailwind CSS with custom academic palette (midnight navy `#0B0F19`, slate, electric blue `#38BDF8`, and emerald `#10B981`).
  - Added role-based client-side route guards (`ProtectedRoute.js`) preventing unauthorized access to `/admin`, `/institution`, and `/student`.
  - Redesigned Admin, Institution, and Student dashboards with responsive data grids, search filtering, and live transaction links.
- **Backend API Restructuring**:
  - Refactored all controllers to enforce strict role-based access control (RBAC).
  - Implemented data minimization sanitization filter (`sanitizePublicCertificate`) on public verification endpoints to prevent PII leakage.
  - Configured strict Cross-Origin Resource Sharing (CORS) with credential validation.

### Security
- **Eliminated Hardcoded Ethereum Private Key**:
  - Removed plaintext testnet private key from upstream `contracts/getAddress.js`.
  - Refactored script to read strictly from `process.env.ETH_PRIVATE_KEY` with defensive error handling.
- **Eliminated Plaintext Password Logging**:
  - Removed `console.log('Admin password from env:', process.env.ADMIN_PASSWORD)` from `backend/controllers/authController.js`.
- **Environment Isolation**:
  - Cleaned all tracked files of secrets; added comprehensive `.env.example` templates across root, backend, and contracts.
- **Sanitized Git Index**:
  - Purged `.DS_Store`, cache directories, temporary image uploads, and binary models from Git tracking.

### Removed
- Removed unauthenticated standalone template upload route (`/api/template/upload`) to eliminate Server-Side Template Injection (SSTI) and Remote Code Execution risks.
- Removed legacy unused dependencies and dead code paths from upstream proof-of-concept.

---

## [0.1.0] - Upstream Baseline
- Initial open-source release of **Certiport** by Alwin James (MIT License).
