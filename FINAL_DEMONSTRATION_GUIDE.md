# EMERTECH CERTIFY v2.0 — FINAL DEMONSTRATION & VIVA GUIDE
### AI-Assisted Blockchain-Based Academic Certificate Verification System

**Lead Architect & Developer**: Saqib Ahmad Bhat  
**Academic Affiliation**: Government College of Engineering, Tirunelveli  
**Department**: Computer Science and Engineering  
**Demonstration Context**: AI and Blockchain Engineer Intern Demonstration, Emertech Innovations Private Limited  

---

## 1. Quick Project Summary (30-Second Elevator Pitch)

> *"Professor, **Emertech Certify v2.0** is an independent, decentralized credential verification platform engineered to eliminate academic credential fraud and provide mathematically tamper-evident degree verification.*
>
> *Traditional paper and digital PDF certificates are easily altered using graphic editing software. Our system solves this by computing a deterministic **SHA-256 cryptographic digest** of the canonical academic record and anchoring that unique 32-byte digest to an **Ethereum smart contract** (`EmertechCertificateRegistry.sol`) signed by an accredited university's verified wallet.*
>
> *Anyone—such as an employer, background screening service, or embassy—can verify an authentic document in four distinct modes: by entering the 64-character hash, by uploading the candidate's PDF file for real-time bitwise comparison, by scanning the dynamic QR code, or by processing a physical scanned transcript through our local **Tesseract.js neural OCR engine**.*
>
> *If an attacker modifies even a single character or grade in the PDF, the SHA-256 avalanche effect alters the checksum, and our verifier immediately flags **TAMPERING DETECTED**. Crucially, **zero personal student data is stored on-chain**, preserving privacy while guaranteeing tamper evidence."*

---

## 2. Complete Local Setup & Launch Instructions

Open three terminal windows from the repository root:

### Terminal 1: Local Blockchain Node & Smart Contract Deployment
```bash
cd cleanroom/contracts
npx hardhat node
```
*In a secondary tab or after the node starts:*
```bash
cd cleanroom/contracts
npx hardhat run scripts/deploy.js --network localhost
```
*Note the deployed contract address printed to the terminal.*

### Terminal 2: One-Time Super Admin Bootstrap & Backend API Microservice
```bash
cd cleanroom/backend
# 1. Run one-time Super Admin bootstrap CLI with compliant password (min 12 chars, upper, lower, digit, special)
BOOTSTRAP_ADMIN_EMAIL="governance.admin@emertech.org" \
BOOTSTRAP_ADMIN_PASSWORD="GovernanceAdmin2026!#Strong" \
BOOTSTRAP_ADMIN_NAME="Lead Governance Architect" \
npm run bootstrap:admin

# 2. Launch Backend API (Port 5001)
npm start
```

### Terminal 3: React 19 Frontend Web Portal
```bash
cd cleanroom/frontend
npm start
```
*Opens automatically at `http://localhost:3000`.*

---

## 3. Five-Minute Evaluator Demonstration Walkthrough

### Minute 1: System Overview & Architecture (Landing Page)
1. Navigate to `http://localhost:3000`.
2. Present the landing page with the interactive SHA-256 digest simulator.
3. Type arbitrary text into the simulator to demonstrate the **SHA-256 avalanche effect** live to the evaluator.
4. Explain the three core platform roles:
   - **Governance Super Administrator**: Approves universities and accredits their wallets on-chain.
   - **Academic Institution**: Issues vector degree certificates with cryptographic QR stamps.
   - **Public Verifier / Student**: Verifies authenticity, claims institutional enrollment, and downloads official transcripts.

### Minute 2: Institution Accreditation & Administrator Provisioning
1. Sign in as Super Administrator:
   - Email: `governance.admin@emertech.org`
   - Password: `GovernanceAdmin2026!#Strong`
2. Open the **Admin Dashboard**:
   - Show the queue of registered academic institutions.
   - Locate **Apex Institute of Technology (AIT)** (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`).
   - Click **Authorize Institution On-Chain**.
   - Show the terminal: an EVM transaction is mined setting institution status to `2` (Authorized).
3. Demonstrate **Protected Administrator Provisioning**:
   - Provision an Institution Administrator account for AIT:
     - Email: `dean@apex.edu.test`
     - Password: `DeanSecurePassword2026!`
   - Show that non-administrators are strictly prevented from creating administrative accounts.

### Minute 3: Institutional Issuance & Vector PDF Generation
1. Sign out and sign in as the Institution Administrator (`dean@apex.edu.test` / `DeanSecurePassword2026!`).
2. Navigate to **Issue Certificate**:
   - Fill in graduate details:
     - Student Name: *Jane H. Doe*
     - Student Identifier: *STU-2026-0042*
     - Degree: *Bachelor of Science in Computer Engineering*
     - Graduation Date: *2026-05-15*
3. Click **Preview & Issue Certificate**:
   - Show the real mined Ethereum transaction hash.
   - Show that the **on-chain issuer matches the institution's wallet** (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`).
4. Click **Download Vector PDF**:
   - Open the generated PDF: highlight the security borders, official seal, embedded QR code, and footer SHA-256 checksum.

### Minute 4: Multi-Modal Verification & Tamper Detection
1. Open an Incognito window or log out and visit `http://localhost:3000/verify`.
2. **Mode 1 — Direct Hash Verification**:
   - Paste the certificate SHA-256 hash.
   - Result: Instant **GREEN BADGE: AUTHENTIC**, displaying on-chain issuer wallet and verification timestamp.
3. **Mode 2 — Authentic PDF Upload**:
   - Drag and drop the downloaded authentic PDF into the file verifier.
   - Result: **GREEN BADGE: AUTHENTIC** (`tamperDetected: false`).
4. **The "Magic" Tamper Detection Test**:
   - Open the PDF in a binary editor or flip a byte, or upload a modified version.
   - Result: Instant **RED BADGE: TAMPERING DETECTED**.
   - Explain to the professor: *"Because the PDF was modified by even 1 byte, the computed SHA-256 hash diverged from the immutable on-chain digest, immediately flagging the document as forged."*

### Minute 5: Certificate Revocation Lifecycle
1. Return to the Institution Portal.
2. Locate the certificate and click **Revoke Certificate**:
   - Enter reason: *"Administrative correction: Updated course distinction"*.
   - Confirm transaction: The smart contract marks `isRevoked: true` via a mined transaction.
3. Return to the Public Verifier and re-verify the certificate hash or PDF.
4. Result: Instant **AMBER/RED BADGE: REVOKED**, displaying revocation timestamp and reason.
5. Conclude: *"This demonstrates complete lifecycle governance from initial accreditation to on-chain issuance and revocation."*

---

## 4. Key Viva Questions & Answers for Evaluators

### Q1. What is the fundamental difference between storing certificates in MongoDB vs. on Ethereum?
> **Answer**: Centralized databases can be modified, deleted, or manipulated by anyone with administrative database access or via SQL/NoSQL injection vulnerabilities. In contrast, an Ethereum smart contract provides an immutable, decentralized append-only ledger. Once a 32-byte certificate hash is committed in a mined block, it cannot be altered, forged, or backdated by anyone, including the server administrators.

### Q2. Why did you store a SHA-256 hash (`bytes32`) instead of the whole certificate PDF on-chain?
> **Answer**: Storing raw files on Ethereum is prohibitively expensive (storing 1 MB on-chain costs thousands of dollars in gas) and publicly exposes personal data. Storing a 32-byte cryptographic SHA-256 digest costs fractions of a cent, provides mathematical proof of document integrity, and preserves student privacy by ensuring zero PII is written to the public ledger.

### Q3. How does your system support certificate revocation if the blockchain is immutable?
> **Answer**: Immutability means past transactions cannot be deleted. We model revocation as a state transition in our smart contract: the `CertificateRecord` struct contains a boolean `isRevoked` and `revokedAt` timestamp. When the authorized issuing institution calls `revokeCertificate()`, the contract updates this flag. The issuance history remains permanently auditable, but verifiers immediately see that the credential is no longer valid.

### Q4. Who is authorized to revoke a certificate?
> **Answer**: Revocation is strictly restricted to the **original issuing institution's wallet address** or the **contract owner** in emergencies (`msg.sender == cert.issuer || msg.sender == owner`). If any other wallet or student attempts revocation, the transaction reverts with `UnauthorizedRevocation()`.

### Q5. How do you prevent privilege escalation and identity spoofing in public registration?
> **Answer**: In `AuthController.js`, any registration request supplying `role: 'SUPER_ADMIN'` or `role: 'INSTITUTION_ADMIN'` is rejected with HTTP 403 Forbidden. Furthermore, client self-assertion of `studentIdentifier` or `institutionCode` is rejected with HTTP 400 Bad Request. Public registration provisions unassociated student accounts only. Institutional identity is established cryptographically through institution-issued enrollment verification tokens. Administrative accounts require out-of-band one-time CLI bootstrapping or authenticated Super Admin provisioning.

### Q6. How are university signing private keys protected?
> **Answer**: Keys are managed by `KeyVaultService` using authenticated AES-256-GCM encryption with 100,000 iterations of PBKDF2 key derivation, per-record random 256-bit salts, and AAD bound to the institution's wallet address. Master keys require a minimum 32-character secret (`KEY_VAULT_SECRET`). Encrypted ciphertexts are stored in MongoDB with key derivation verification, and plaintext private keys are decrypted into ephemeral memory only during transaction signing.

### Q7. What role does Tesseract.js WebAssembly OCR play?
> **Answer**: Tesseract.js runs local WebAssembly optical character recognition on scanned physical certificate images. It parses student names and identifiers to speed up administrative data entry and cross-verify physical documents without incurring cloud API costs or leaking data to third parties.

### Q8. What happens if the Ethereum blockchain node goes offline?
> **Answer**: The application includes a resilient offline demonstration mode (`OFFCHAIN_DEMO`). If the blockchain JSON-RPC node is unreachable, the system issues and retrieves credentials using MongoDB, while clearly marking verification responses with an amber `OFFCHAIN_DEMO` badge so evaluators know the record is not anchored on-chain.
