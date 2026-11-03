# FINAL QUALITY AUDIT REPORT — EMERTECH CERTIFY
**AI-Assisted Blockchain-Based Academic Certificate Verification System**

* **Developer & Maintainer**: Saqib Ahmad Bhat
* **Academic Institution**: Government College of Engineering, Tirunelveli (Computer Science and Engineering)
* **Academic Demonstration Context**: AI and Blockchain Engineer Intern Demonstration (Emertech Innovations Private Limited context)
* **Target GitHub Repository**: [https://github.com/SaqibAhmadBhat/emertech-certify](https://github.com/SaqibAhmadBhat/emertech-certify)
* **Upstream Attribution**: Based on the MIT-licensed open-source project [Certiport](https://github.com/J7-Alwin/Certiport) by Alwin James
* **Date & Timestamp**: 2026-11-03

---

## 1. Verified Technology Stack & Installed Versions

The following exact versions were inspected directly from `package.json` manifests, lockfiles, and active runtime environments:

| Technology / Package | Manifest / Configured Version | Actual Installed Version | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>=18.0.0` | `v22.23.3` | Server execution runtime |
| **npm** | `>=9.0.0` | `10.9.9` | Package manager |
| **React** | `^19.1.1` | `19.1.1` | Frontend Single Page Application framework |
| **React DOM** | `^19.1.1` | `19.1.1` | React DOM renderer |
| **React Router DOM** | `^6.14.1` | `6.14.1` | Client-side routing and route guarding |
| **Lucide React** | `^0.544.0` | `0.544.0` | Professional lightweight iconography suite |
| **Solidity Compiler** | `^0.8.19` | `0.8.19` (solc) | Smart contract source and byte-code compilation |
| **Hardhat** | `^2.19.4` | `2.26.3` | Ethereum development environment and EVM test runner |
| **Ethers.js (Contracts)** | `^5.7.2` | `5.8.0` | Web3 contract testing and deployment scripts |
| **Ethers.js (Backend)** | `^5.7.2` | `5.7.2` | JSON-RPC provider and smart contract interop |
| **Express.js** | `^4.18.2` | `4.18.2` | REST API gateway and routing |
| **Mongoose** | `^7.5.2` | `7.5.2` | MongoDB Object Data Modeling (ODM) |
| **In-Memory MongoDB** | `^9.5.0` | `9.5.0` | Automated zero-configuration embedded database fallback |
| **Tesseract.js** | `^5.1.1` | `5.1.1` | Free, locally runnable neural OCR engine |
| **pdf-parse** | `^1.1.1` | `1.1.1` | Native PDF content stream and text extractor |
| **Puppeteer** | `^21.3.3` | `21.3.3` | Headless Chrome/Chromium A4 PDF renderer |
| **pdf-lib** | `^1.17.1` | `1.17.1` | Emergency vector PDF rendering fallback |

---

## 2. Features Genuinely Implemented & Verified

### 2.1 Academic Identity, Attribution & Governance
- **Author Attribution**: Saqib Ahmad Bhat is credited in all newly authored source files, docstrings, UI navigation bars, and academic demonstration footers.
- **Upstream License Preservation**: The complete original MIT License is retained in [LICENSE](LICENSE).
- **Modification Notice ([NOTICE.md](NOTICE.md))**: Full disclosure stating that Saqib Ahmad Bhat did not author upstream code, detailing the open-source foundation, and stating that Emertech Innovations Private Limited does not officially endorse, own, or commercially sponsor this independent academic demonstration.

### 2.2 Administrator Governance Module
- Admin authentication via secure bcrypt password verification (`admin@emertech.local` / `admin123`).
- Institutional onboarding queue with real-time approval/rejection workflows (`/api/admin/pending-requests`, `/api/admin/approve/:id`).
- Dynamic institutional ID assignment (e.g., `un01`).
- Global audit metrics aggregating registered institutions, students, certificates, and revocations.

### 2.3 Educational Institution Module
- Institution login and session management via JWT.
- Student account registration and association with university records.
- Template provisioning (Semester Marks Card, Degree Certificate, Transfer Certificate, Migration Certificate).
- Automated certificate issuance pipeline generating:
  1. Unique human-readable Blockchain ID (e.g., `UN01-CERT-8UES57-20261103`).
  2. Cryptographic **SHA-256 binary hash** computed across generated PDF bytes.
  3. QR code encoding the direct public verification URL (`/verify?id=...`).
  4. On-chain certificate registration on Ethereum EVM contract.
- Certificate revocation workflow with recorded revocation reasons and timestamps.

### 2.4 Student Self-Service Module
- Authenticated student portal (`saqib.student@gce.edu.in`).
- Credentials ledger showing all certificates issued to the student's enrollment number.
- Status badges: **Authentic** (green) vs **Revoked** (amber/red).
- One-click PDF download streaming valid binary certificates.
- Direct blockchain ID copy-to-clipboard functionality.

### 2.5 Multi-Modal Public Verification Module (Zero Login Required)
- **Mode 1: Certificate ID Search**: Resolves blockchain record, checks database cache, and displays non-sensitive student credentials while masking contact details.
- **Mode 2: PDF Document Upload**: Reads raw binary buffer of uploaded file, computes SHA-256 hash dynamically, and matches it against the recorded `bytes32 documentHash`:
  - If identical: Flags **AUTHENTIC**.
  - If modified by even one byte: Flags **TAMPERING DETECTED** and shows the expected vs computed hash mismatch.
- **Mode 3: QR Code Verification**: Decodes uploaded QR images or processes incoming QR deep-link query parameters (`?id=...`) to auto-verify credentials.
- **Revocation Alerts**: Instantly alerts verifiers if a certificate has been revoked, displaying the reason and revocation timestamp.

### 2.6 AI Module (AI-Assisted Certificate Extraction)
- **Local Neural OCR**: Powered by Tesseract.js and PDF stream analysis without any paid or third-party cloud API dependencies.
- **Candidate Field Pre-Fill**: Extracts Student Name, Registration Number, Course, and Date from draft certificates or image scans.
- **Human-in-the-Loop Verification**: Results are displayed in an editable UI allowing authorized administrators to review and correct fields prior to blockchain minting.
- **Academic Transparency Disclaimer**: Explicitly labeled as an OCR extraction assistant for administrative speed, **not** an automated statistical fraud detector.

### 2.7 Storage Layer with Zero-Cost Local Fallback
- Dual-mode storage engine: automatically saves generated certificates to `backend/uploads/certificates/`.
- If Pinata API credentials are configured in `.env`, automatically pins files to decentralized IPFS; if omitted, seamlessly uses the local file system fallback without errors.

---

## 3. Smart Contract Test Results

All nine unit tests were executed on the Hardhat Ethereum Virtual Machine (`contracts/test/CertificateRegistry.test.js`).

### Actual Terminal Output:
```text
> emertech-certify-contracts@1.0.0 test
> hardhat test

  CertificateRegistry (Emertech Certify)
    ✔ Should set the deployer as owner and authorized issuer (42ms)
    ✔ Should allow the owner to authorize an institution wallet (45ms)
    ✔ Should issue a certificate with SHA-256 document hash (58ms)
    ✔ Should prevent duplicate certificate IDs (49ms)
    ✔ Should reject issuance from unauthorized callers (41ms)
    ✔ Should verify authentic certificates with matching SHA-256 hash (47ms)
    ✔ Should detect tampered certificate with mismatched hash (51ms)
    ✔ Should support certificate revocation and update verification status (62ms)
    ✔ Should prevent unauthorized revocation by third parties (48ms)

  9 passing (588ms)
```

### 3.2 Real On-Chain Backend-to-Blockchain Integration Verification:
A live transaction test against the active Hardhat blockchain node (`http://127.0.0.1:8545`) was executed to confirm that smart contract transactions, document hash registration, on-chain tamper detection, and revocations work in practice:

```text
===========================================================
🔗 Emertech Certify: Live Backend-to-Blockchain Integration Test
===========================================================
1. Connecting to RPC Node: http://127.0.0.1:8545
   ✅ Connected to network: unknown (Chain ID: 31337)

2. Verifying Contract ABI & Address...
   Signer Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Signer Balance: 9999.9981415113203125 ETH
   Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Contract Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Owner matches signer: true

3. Testing Real On-Chain Certificate Issuance Transaction...
   Minting Certificate ID: LIVE-DEMO-1793722989796
   Document SHA-256 Hash: 0xe89183378da69a8c7657c8f2870871e6f78d14847f40f3dfd47f2a1f25b08a1c
   Transaction Hash: 0xab7a88f377302874d8433209e9e031dee6a142c16e204c76f5ba5010f2fcf79a
   ✅ Transaction Mined in Block: 2 (Gas Used: 241676)

4. Testing Real On-Chain Verification of Authentic Hash...
   Smart Contract Response: isValid = true , status = AUTHENTIC
   ✅ ON-CHAIN AUTHENTICITY CONFIRMED!

5. Testing Real On-Chain Tamper Detection...
   Smart Contract Response: isValid = false , status = TAMPERED_HASH_MISMATCH
   ✅ ON-CHAIN TAMPER DETECTION CONFIRMED!

6. Testing Real On-Chain Revocation Transaction...
   Revoke Transaction Hash: 0xb85a116e4bd9c7fea9b561b0558f07150cb7fa857356ff183a5a621b2a401832
   ✅ Revocation Mined in Block: 3 (Gas Used: 99796)

7. Testing Real On-Chain Verification of Revoked Certificate...
   Smart Contract Response: isValid = false , status = REVOKED
   ✅ ON-CHAIN REVOCATION CONFIRMED!

8. On-Chain Certificate Struct Inspection:
   ID: LIVE-DEMO-1793722989796
   Hash: 0xe89183378da69a8c7657c8f2870871e6f78d14847f40f3dfd47f2a1f25b08a1c
   Issuer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Revoked: true
   Revocation Reason: Administrative syllabus update

🎉 ALL REAL BACKEND-TO-BLOCKCHAIN TESTS PASSED 100%!
```

---

## 4. Backend & AI Integration Test Results

The backend automated test suite (`backend/test/api.test.js`) executes 17 end-to-end integration tests using an embedded in-memory MongoDB database.

### Actual Terminal Output:
```text
> emertech-certify-backend@1.0.0 test
> node test/api.test.js

====================================================
🧪 Starting Emertech Certify Automated API Test Suite
👨‍💻 Developer: Saqib Ahmad Bhat
====================================================

ℹ️ Local MongoDB daemon not detected. Initializing embedded in-memory MongoDB server...
✅ Embedded in-memory MongoDB initialized successfully at: mongodb://127.0.0.1:36396/
ℹ️ Running in self-contained demonstration mode (no external database required).
=================================================
🎓 Emertech Certify Backend running on port 5001
👨‍💻 Developer: Saqib Ahmad Bhat
🏛️ Institution: Government College of Engineering, Tirunelveli
🚀 Verification Engine & AI OCR Module Online
=================================================
1. Testing System Health Check...
   ✅ Health check passed. Developer: Saqib Ahmad Bhat

2. Testing Administrator Authentication...
   ✅ Admin authentication successful. JWT received.

3. Testing Institution Registration (Onboarding Queue)...
   ✅ Institution registration queued for administrator approval.

4. Testing Admin Institutional Approval...
   ✅ Institution approved. Assigned University ID: un01

5. Testing Approved Institution Login...
   ✅ Institution login authorized.

6. Testing Student Account Registration & Login...
   ✅ Student registration and authentication successful.

7. Testing Template Provisioning...
   ✅ Templates available: 4. Selected Template: Semester Marks Card

8. Testing Academic Certificate Issuance Pipeline...
ℹ️ Stored locally with hash 0x27806045a67e80de57662012c5bc1cf00f50d1cfeb5d0944115c28ff43fdcfdc
   ✅ Certificate generated successfully!
      Blockchain ID: UN01-CERT-8UES57-20261103
      SHA-256 Hash: 0x27806045a67e80de57662012c5bc1cf00f50d1cfeb5d0944115c28ff43fdcfdc
      Storage Type: local

9. Testing Public Verification by Certificate ID...
   ✅ Public verification by ID: Status = AUTHENTIC

10. Testing Public Verification by Original PDF Upload...
Verifying uploaded PDF. Computed SHA-256: 0x27806045a67e80de57662012c5bc1cf00f50d1cfeb5d0944115c28ff43fdcfdc
   ✅ Uploaded PDF verified: Status = AUTHENTIC (Cryptographic digest matches)

11. Testing Tamper Detection on Modified PDF Document...
Verifying uploaded PDF. Computed SHA-256: 0x37d74fdb0575cfdc4c0e77ec497fee91ec89148b02bce91c4212ee1688503c43
   ✅ Tampering detected! Status = TAMPERED (Hash mismatch flagged)

12. Testing Public Verification by QR Code Payload...
   ✅ QR Code verification successful: Status = AUTHENTIC (Resolved ID: UN01-CERT-8UES57-20261103)

13. Testing Certificate PDF Download Endpoint...
   ✅ PDF Download verified: HTTP 200 with application/pdf Content-Type (107052 bytes)

14. Testing Certificate Revocation Pipeline...
   ✅ Certificate revoked successfully.

15. Testing Public Verification of Revoked Certificate...
   ✅ Revocation confirmed! Status = REVOKED. Reason: "Administrative correction: Updated course syllabus"

16. Testing Student Dashboard Retrieval...
   ✅ Student certificates successfully retrieved from student portal.

17. Testing AI-Assisted Certificate Information Extraction (PDF Stream)...
   ✅ AI PDF Parser successfully processed document!
      Engine: PDF Text Stream Parser
      Detected Student: Saqib Ahmad Bhat
      Detected Course: B.E. in Computer Science and Engineering
      Disclaimer present: true

18. Testing AI-Assisted Image OCR with Tesseract.js (Scanned PNG)...
Running local Tesseract OCR engine on image document...
   ✅ Tesseract.js Neural OCR verified on real image file!
      Engine: Tesseract.js Neural OCR Engine
      Extracted Student: Saqib Ahmad Bhat
      Extracted Register No: 950020104001
      Extracted Course: BE in Computer Science and Engineering

====================================================
🎉 ALL 18 AUTOMATED API & AI TESTS PASSED SUCCESSFULLY!
====================================================
```

---

## 5. Frontend Production Build Results

Executed under strict CI environment (`CI=true npm run build`):

```text
> certiport-frontend@0.1.0 build
> react-scripts build

Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  87.38 kB  build/static/js/main.e7b389cd.js
  6.27 kB   build/static/css/main.70126575.css

The project was built assuming it is hosted at /.
The build folder is ready to be deployed.
```
*Result*: **0 compilation errors, 0 ESLint warnings**, compact 87.38 kB bundle.

---

## 6. Security Audit Findings & Upstream Remediation

### 6.1 Upstream Exposed Credentials Completely Purged
1. **Hardcoded Upstream Private Key**: An active 256-bit Ethereum private key in the upstream `contracts/getAddress.js` was identified. The secret was completely removed from source code, `.env.example`, and all documentation files ([PROJECT_AUDIT.md](PROJECT_AUDIT.md), [SECURITY.md](SECURITY.md)). The key was replaced with generalized security explanations and the affected wallet was flagged as permanently compromised.
2. **Hardcoded Plaintext Console Logging**: Upstream lines in `authController.js` that logged administrator passwords into stdout were completely purged.
3. **Unprotected Template Injection**: Insecure template upload endpoints were removed; template provisioning is restricted to authenticated institution roles.
4. **Client-Side Authorization**: Unauthenticated direct access to administrative paths (`/admin`, `/university`) was patched using `ProtectedRoute.js`.
5. **Port Conflict**: Reconfigured backend from port 5000 to port 5001 to eliminate collisions with macOS AirPlay Receiver (`ControlCenter`).

---

## 7. Dependency Audit & Remaining Known Vulnerabilities

Separate `npm audit` scans were performed across all tiers:

| Subdirectory | Audit Result | Severity Breakdown | Root Cause & Remediation Strategy |
| :--- | :--- | :--- | :--- |
| `contracts/` | 57 vulnerabilities | 19 low, 13 mod, 24 high, 1 crit | Dev-dependency toolchain (`hardhat 2.x`, `mocha`, `undici`). Running `npm audit fix --force` would install `@nomicfoundation/hardhat-toolbox@7.0.0`, breaking Ethers v5 compatibility. Contracts execute strictly in local development sandbox. |
| `backend/` | 31 vulnerabilities | 3 low, 3 mod, 19 high, 6 crit | Deep transitive dependencies inside `@pinata/sdk` (legacy `axios 0.x`) and `puppeteer 21.x` (`tar-fs`, `ws`). Non-breaking patches applied. System uses local storage fallback and isolated headless PDF generation. |
| `frontend/` | 72 vulnerabilities | 18 low, 14 mod, 37 high, 3 crit | Inherited through `react-scripts 5.0.1` (`webpack-dev-server`, `jsdom`). `npm audit fix --force` would downgrade to `react-scripts@0.0.0` or break the build pipeline. The production output (`build/`) compiles cleanly without runtime exposure. |

> **Audit Recommendation**: As recommended by standard security engineering practice, `npm audit fix --force` was intentionally avoided to protect project stability and prevent breaking changes.

---

## 8. Known Limitations

1. **Local Demonstration Blockchain**: By default, the application runs against Hardhat's local EVM (Chain ID 31337). Public testnet deployment (Sepolia or Polygon Amoy) requires funding an account with testnet gas.
2. **In-Memory Database Persistence**: When MongoDB is not installed locally, the backend uses `mongodb-memory-server` for zero-configuration testing. Data created during that session resets when the backend server process terminates. For persistent data, configure a local or cloud MongoDB URI in `backend/.env`.
3. **OCR Scope**: Tesseract.js is trained for digital typography and standard printed certificates. Highly decorative calligraphy or cursive handwriting may require administrative field correction in the preview screen.

---

## 9. Exact Commands to Run the Application

### 1. Run Complete Automated Test Suite:
```bash
npm run test:all
```

### 2. Start the Backend API (Port 5001):
```bash
npm run start:backend
```

### 3. Start the Frontend Application (Port 3000):
```bash
npm run start:frontend
```

### Demonstration Accounts:
* **Admin**: `admin@emertech.local` / `admin123`
* **Institution**: `vc@gce-tveli.edu.in` / `UniversitySecret123`
* **Student**: `saqib.student@gce.edu.in` / `StudentSecurePassword123`

---

## 10. Exact Commands to Publish to GitHub Repository

The repository has been verified and prepared for Git without unprompted initialization. To publish to your GitHub repository:

```bash
# 1. Initialize local Git repository
git init

# 2. Stage all verified files (.gitignore excludes .env, node_modules, and build caches)
git add .

# 3. Create the initial commit
git commit -m "feat: complete transformation to Emertech Certify academic verification system"

# 4. Set default branch to main
git branch -M main

# 5. Link to your GitHub remote repository
git remote add origin https://github.com/SaqibAhmadBhat/emertech-certify.git

# 6. Push to GitHub
git push -u origin main
```

