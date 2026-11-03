# Comprehensive Technical Audit: Certiport Codebase

**Project**: Certiport (Upstream Repository: [https://github.com/J7-Alwin/Certiport](https://github.com/J7-Alwin/Certiport))  
**Target Transformation**: Emertech Certify — AI-Assisted Blockchain-Based Academic Certificate Verification System  
**Auditor & Developer**: Saqib Ahmad Bhat (B.E. Computer Science and Engineering, Government College of Engineering, Tirunelveli)  
**Academic Context**: AI and Blockchain Engineer Intern Demonstration (Emertech Innovations Private Limited Context)  
**Audit Date**: November 2026  
**Environment**: macOS (Apple Silicon, Darwin Kernel), Node.js v22.23.3, npm 10.9.9  

---

## 1. Executive Summary

This audit presents an exhaustive technical inspection of the open-source **Certiport** repository prior to executing the transformation into **Emertech Certify**. The codebase was analyzed across its four principal layers:
1. **Smart Contracts & Blockchain Tooling** (`contracts/`)
2. **Backend REST API & Microservices** (`backend/`)
3. **Frontend Single Page Application** (`frontend/`)
4. **Certificate Rendering & Storage Layer** (`backend/templates/`, `backend/utils/`)

### Key Audit Highlights:
- **Critical Security Exposure**: A real Ethereum private key was committed in plain text within `contracts/getAddress.js`. Furthermore, the backend authentication controller logs the plaintext administrator password directly to standard output upon every login attempt.
- **Smart Contract Architectural Gaps**: The existing `CertificateRegistry.sol` smart contract is completely missing certificate revocation capabilities, lacks SHA-256/bytes32 cryptographic certificate fingerprinting, and provides zero access control (any arbitrary external wallet can call `issueCertificate`).
- **Storage Fragility**: Certificate issuance hard-depends on Pinata (IPFS). If external API keys are invalid or unconfigured, the issuance pipeline crashes. No local storage fallback exists.
- **Verification Incompleteness**: The public verification endpoint queries only the local MongoDB database. It fails to verify cryptographic integrity against the Ethereum smart contract and offers no PDF binary upload or QR scanning verification.
- **Frontend Fragility & Route Exposure**: Dashboard routes (`/admin`, `/university`, `/student`) lack server and client-side route guard protection (`PrivateRoute` is written but never mounted). Hardcoded `localhost:5000` URLs are scattered throughout multiple components.
- **Dead Code & Redundancy**: An entire duplicate route file (`routes/studentRoutes.js`), a broken controller (`templateController.js`), and unused client services (`universityService.js`) clutter the codebase.

---

## 2. Directory Structure Analysis

```
Certiport-main/
├── README.md                           # Original project overview & setup guide
├── LICENSE                             # MIT License (Copyright 2026 Alwin James)
├── .gitignore                          # Global gitignore
├── Certiport-documentation.pdf         # Upstream project architecture documentation
├── contracts/                          # Hardhat Solidity environment
│   ├── contracts/
│   │   └── CertificateRegistry.sol     # Single smart contract
│   ├── scripts/
│   │   └── deploy.js                   # Ethers v5 deployment script
│   ├── getAddress.js                   # CRITICAL VULNERABILITY: Hardcoded private key
│   ├── getBalance.js                   # Testnet balance utility
│   ├── hardhat.config.js               # Hardhat configuration (Solidity 0.8.19)
│   ├── package.json                    # Over-bloated dependencies manifest (~240 entries)
│   └── .env.example                    # Misaligned environment variables
├── backend/                            # Node.js Express REST API
│   ├── server.js                       # Express application entrypoint
│   ├── package.json                    # Backend dependencies & script definitions
│   ├── .env.example                    # Environment configuration template
│   ├── config/
│   │   └── db.js                       # Mongoose MongoDB connection
│   ├── middleware/
│   │   └── auth.js                     # JWT authorization verification middleware
│   ├── models/
│   │   ├── User.js                     # Multi-role user schema (Admin/University/Student)
│   │   ├── Certificate.js              # Certificate schema with blockchain metadata
│   │   ├── PendingRequest.js           # University onboarding approval queue
│   │   └── Template.js                 # Certificate dynamic EJS template schema
│   ├── controllers/
│   │   ├── authController.js           # Registration & login logic (logs admin password)
│   │   ├── adminController.js          # Institution approvals & platform statistics
│   │   ├── universityController.js     # Issuance, template upload, revocation
│   │   ├── studentController.js        # Student profile & certificate viewing
│   │   ├── publicController.js         # Public certificate verification
│   │   └── templateController.js       # Broken/legacy template controller
│   ├── routes/
│   │   ├── auth.js                     # /api/auth routes
│   │   ├── admin.js                    # /api/admin routes
│   │   ├── university.js               # /api/university routes
│   │   ├── student.js                  # /api/student routes
│   │   ├── studentRoutes.js            # DEAD CODE: 100% duplicate of student.js
│   │   ├── public.js                   # /api/public routes (duplicates publicController)
│   │   └── template.js                 # Unauthenticated public template route
│   ├── utils/
│   │   ├── pdfGenerator.js             # Puppeteer HTML-to-PDF rendering engine
│   │   ├── pinata.js                   # Pinata IPFS SDK integration
│   │   ├── qr.js                       # QRCode data URL generator
│   │   └── templateParser.js           # Regex EJS placeholder parser (unused)
│   ├── templates/                      # University EJS templates
│   │   ├── un02/                       # Sample university 02 templates
│   │   └── un03/                       # Sample university 03 templates
│   └── abi/
│       └── CertificateRegistry.json    # Compiled contract ABI for backend integration
└── frontend/                           # React SPA layer
    ├── package.json                    # Redundant outer package.json
    ├── package-lock.json               # Outer lockfile
    └── certiport-frontend/             # Actual CRA React application
        ├── package.json                # Dependencies (React 19, Lucide, Axios)
        ├── .env.example                # Frontend environment template
        ├── public/                     # Public static assets
        └── src/
            ├── App.js                  # Route definitions (missing route guards)
            ├── index.js                # React DOM render entry point
            ├── api/
            │   └── axiosInstance.js    # Axios client with bearer token interceptor
            ├── utils/
            │   └── auth.js             # LocalStorage auth helpers
            ├── components/
            │   ├── Navbar.js           # Navigation bar with role-based links
            │   └── PrivateRoute.js      # DEAD COMPONENT: Exists but never imported
            ├── services/
            │   ├── studentService.js   # Fetch-based student API service
            │   └── universityService.js # DEAD CODE: Unused duplicate service
            ├── pages/
            │   ├── LandingPage.js      # Marketing homepage
            │   ├── Login.js            # Authentication page
            │   ├── Register.js         # Multi-role registration form
            │   ├── AdminDashboard.js   # Admin portal
            │   ├── UniversityDashboard.js # Institution portal
            │   ├── StudentDashboard.js # Student portal
            │   └── PublicVerify.js     # Public verification portal
            └── styles/                 # 10 separate CSS files (~91 KB)
```

---

## 3. Comprehensive Security Audit

### 3.1 🔴 CRITICAL: Plaintext Private Key Exposure in `contracts/getAddress.js`
- **Location**: `contracts/getAddress.js`
- **Observation**: An active 256-bit Ethereum private key was hardcoded in plain text directly in the upstream source code.
- **Risk**: Hardcoded raw private keys in source code mean any funds or contract permissions tied to that wallet address are permanently compromised across public Git histories.
- **Remediation**:
  1. The hardcoded credential was completely excised from code and documentation.
  2. The script was refactored to load exclusively from `process.env.ETH_PRIVATE_KEY` with safe fallbacks.
  3. The upstream wallet must be considered permanently compromised.
  4. `.env` is rigorously excluded via `.gitignore`.

### 3.2 🔴 CRITICAL: Plaintext Admin Password Logged to stdout
- **Location**: `backend/controllers/authController.js` (lines 173-174)
- **Code snippet**:
  ```javascript
  console.log('Login attempt for:', email);
  console.log('Admin email from env:', process.env.ADMIN_EMAIL);
  console.log('Admin password from env:', process.env.ADMIN_PASSWORD);
  ```
- **Risk**: Every time any user attempts to log into the application, the actual master administrative password configured in the server environment is printed directly into system console logs, process logging daemons, and crash logs.
- **Remediation**: Eliminate all credential logging immediately. Use secure debug-level statements that never dump secret parameters.

### 3.3 🔴 CRITICAL: Unauthenticated Public Template Upload
- **Location**: `backend/routes/template.js` (lines 1-35)
- **Risk**: The `/api/template/upload` route accepts arbitrary `.ejs` and `.html` template uploads with zero authentication middleware. Any anonymous attacker can upload server-rendered EJS templates, potentially achieving Arbitrary Code Execution (Server-Side Template Injection — SSTI) via malicious EJS tags (`<%- process.mainModule.require('child_process').execSync(...) %>`).
- **Remediation**: Deprecate this broken standalone route. Restrict template creation strictly to authorized institution administrators with authenticated JWT validation and sanitization.

### 3.4 🔴 HIGH: Completely Unprotected Frontend Routes
- **Location**: `frontend/certiport-frontend/src/App.js` (lines 1-35)
- **Risk**: Although `PrivateRoute.js` exists in `src/components/`, `App.js` mounts `/university`, `/student`, and `/admin` as plain public `<Route>` components. Any unauthenticated browser user can navigate directly to these routes. While individual components check auth in `useEffect`, this creates a visible flash of protected UI and race condition state vulnerabilities.
- **Remediation**: Wrap all sensitive routes with a robust `ProtectedRoute` component enforcing role verification and redirecting unauthenticated sessions.

### 3.5 🔴 HIGH: Public Unauthenticated Access to Stored Certificate PDFs
- **Location**: `backend/server.js` (line 51)
- **Code snippet**:
  ```javascript
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  ```
- **Risk**: All generated academic certificates, student transcripts, and marks cards stored in `./uploads/certificates` are served statically over HTTP without authentication or token verification.
- **Remediation**: Protect direct certificate downloads through an authenticated streaming controller endpoint that verifies user permissions or verification tokens before transmitting document buffers.

### 3.6 🟡 MEDIUM: Wildcard CORS Configuration
- **Location**: `backend/server.js` (line 18)
- **Risk**: `app.use(cors())` enables permissive cross-origin resource sharing (`Access-Control-Allow-Origin: *`) across all HTTP verbs, exposing API interfaces to unauthorized cross-origin requests.
- **Remediation**: Restrict CORS to configured origins (e.g., `http://localhost:3000` or production domain) with explicit allowed headers and methods.

---

## 4. Smart Contract Audit (`CertificateRegistry.sol`)

### 4.1 Upstream Implementation
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateRegistry {
    struct Certificate {
        string certificateId;
        string ipfsHash;
        address issuer;
        uint256 issuedAt;
    }

    mapping(string => Certificate) public certificates;
    event CertificateIssued(string certificateId, string ipfsHash, address issuer, uint256 issuedAt);

    function issueCertificate(string memory certificateId, string memory ipfsHash) public {
        require(bytes(certificateId).length > 0, "Invalid ID");
        require(bytes(certificates[certificateId].certificateId).length == 0, "Already exists");

        certificates[certificateId] = Certificate({
            certificateId: certificateId,
            ipfsHash: ipfsHash,
            issuer: msg.sender,
            issuedAt: block.timestamp
        });

        emit CertificateIssued(certificateId, ipfsHash, msg.sender, block.timestamp);
    }

    function getCertificate(string memory certificateId) public view returns (string memory, string memory, address, uint256) {
        Certificate storage c = certificates[certificateId];
        return (c.certificateId, c.ipfsHash, c.issuer, c.issuedAt);
    }
}
```

### 4.2 Deficiencies & Vulnerabilities:
1. **Total Absence of Revocation**: The upstream contract provides no `revoked` flag, no `revokeCertificate()` function, and no `CertificateRevoked` event. If an institution revokes an invalid certificate, the blockchain still displays it as indefinitely authentic.
2. **Missing Document Hash (SHA-256 / bytes32)**: The contract stores only `ipfsHash` (an external CID string) and `certificateId`. It does not store a SHA-256 cryptographic digest of the PDF file contents. Without an on-chain document hash, verifiers cannot verify an uploaded PDF document directly against the smart contract without relying on IPFS.
3. **No Access Control**: The `issueCertificate` function is unrestricted (`public`). Any external wallet can register arbitrary certificate records, impersonating universities and contaminating the registry.
4. **Gas Inefficiency**: Using `string` for mapping keys and duplicating `certificateId` inside the struct wastes substantial EVM storage gas.
5. **No Institution Allowlist**: There is no concept of registered/approved issuing institutions within the smart contract.

---

## 5. Backend Architecture & Controller Audit

| Component | Status | Identified Issue |
|---|---|---|
| `routes/studentRoutes.js` | 🔴 Dead Code | 100% redundant identical duplicate of `routes/student.js`. Never imported. |
| `controllers/templateController.js` | 🔴 Broken | Attempts to write properties (`filename`, `originalname`) that do not exist on `Template` schema. |
| `routes/public.js` vs `controllers/publicController.js` | 🟡 Duplicate Logic | `routes/public.js` bypasses `publicController.js` and rewrites verification logic inline. |
| `controllers/universityController.js` | 🟡 Dead Code | Constructs an extensive `transformedUniversity` object (lines 34-51) but returns untransformed raw document. |
| `controllers/adminController.js` | 🟡 Data Inconsistency | `getDashboardStats` and `getApprovedUniversities` hardcode `totalCertificates: 0` instead of counting actual database records. |
| `utils/pinata.js` | 🔴 Hard Dependency | Instantiates Pinata client immediately at startup. Fails catastrophically during issuance if API keys are absent. |
| `utils/pdfGenerator.js` | 🟡 Performance | Launches a fresh headless Chromium instance per PDF request instead of utilizing an efficient instance pool or worker. |

---

## 6. Frontend Architecture & UI/UX Audit

1. **Conflicting API Layers**: Three disjointed network communication strategies exist simultaneously:
   - `axiosInstance` (used only in `Login.js`)
   - `studentService.js` (custom `fetch` wrapper)
   - Inline raw `fetch` calls scattered across `Register.js`, `AdminDashboard.js`, `UniversityDashboard.js`, and `PublicVerify.js`.
2. **Hardcoded Endpoints**: `http://localhost:5000` is hardcoded across at least 6 distinct files, breaking any non-standard local port or production deployment.
3. **Incomplete Public Verification**:
   - PDF file upload verification does not exist.
   - QR code upload triggers a mock `alert("Please use manual entry")`.
   - Verification relies solely on the database without cryptographic hash or blockchain validation.
4. **UI Styling & Theming**:
   - The upstream interface relies on an aggressive dark blue/black palette (`#0A1020`, `#0E1123`) with raw emojis for icons.
   - The user requirements mandate a clean, professional academic aesthetic: white/light backgrounds, navy blue (#0f172a) and purple accents (#6366f1 / #7c3aed), refined typography, and Lucide icons.

---

## 7. Audit Conclusion & Remediation Roadmap

The Certiport project provides a conceptual prototype, but contains critical security vulnerabilities, architectural omissions, and incomplete verification pipelines. The transformation into **Emertech Certify** will systematically address every finding across four execution phases:

1. **Phase 1: Security Hardening & Secret Sanitation**
   - Eliminate hardcoded keys, sanitize debug logging, secure static file serving, and implement strict JWT/CORS protections.
2. **Phase 2: Smart Contract & Blockchain Overhaul**
   - Upgrade `CertificateRegistry.sol` to support SHA-256 certificate document hashing (`bytes32`), issuer authorization controls, on-chain revocation, and comprehensive event logging.
3. **Phase 3: Storage Fallback & AI OCR Module**
   - Implement seamless local storage fallback alongside IPFS, and introduce a zero-cost local OCR engine (`Tesseract.js`) for automated certificate text extraction and field prefilling.
4. **Phase 4: Frontend Redesign & End-to-End Verification**
   - Modernize the UI with navy/purple academic theming, complete the three verification modalities (Certificate ID, PDF SHA-256 upload, QR code scanner), wire robust route protection, and verify all workflows through comprehensive test scripts.

---
*Authored by Saqib Ahmad Bhat — AI and Blockchain Engineer Intern Demonstration*

