# STUDENT VIVA & DEMONSTRATION GUIDE
## Emertech Certify — Academic Certificate Verification System
**Author**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Degree**: B.E. Computer Science and Engineering  
**Academic Demonstration Context**: AI and Blockchain Engineer Intern Demonstration  

---

## 1. Quick Project Summary (30-Second Elevator Pitch)

> *"Professor, **Emertech Certify** is a decentralized academic credentialing and verification platform. Traditional paper and digital PDF certificates are easy to forge with Photoshop. Our system solves this by computing a cryptographic **SHA-256 hash** of the issued certificate PDF and permanently registering that unique 32-byte digest on an **Ethereum smart contract**.*
>
> *Anyone—such as an employer or embassy—can verify an authentic document in three ways: by entering the Certificate ID, by scanning the QR code, or by directly uploading the candidate's PDF. If someone edits even a single letter or grade in the PDF, the SHA-256 digest changes completely, and our system immediately flags **TAMPERING DETECTED**.*
>
> *Additionally, we integrated a local, zero-cost **AI OCR engine (Tesseract.js)** that automatically extracts student names, registration numbers, and degree titles from draft certificates, reducing clerical overhead while keeping the administrator in the loop."*

---

## 2. Core Architecture Explained Simply

```
   ┌──────────────────────────────────────────────────────────┐
   │                  Presentation Layer                      │
   │               React 19 Single Page App                   │
   │   (Navy Blue #0f172a / Purple #6366f1, Lucide Icons)     │
   └────────────────────────────┬─────────────────────────────┘
                                │ REST API / JSON (Port 5001)
   ┌────────────────────────────▼─────────────────────────────┐
   │                   Application Layer                      │
   │               Node.js & Express REST API                 │
   │   • JWT Auth & Role-Based Access Control (bcryptjs)      │
   │   • PDF Generator (Puppeteer & pdf-lib fallback)         │
   │   • AI OCR Engine (Tesseract.js Neural OCR + Parser)     │
   └───────────────┬──────────────────────────┬───────────────┘
                   │                          │ Ethers.js v5
   ┌───────────────▼──────────────┐   ┌───────▼───────────────┐
   │        Storage Layer         │   │   Blockchain Layer    │
   │ • MongoDB (In-Memory Fallback│   │ • Solidity ^0.8.19    │
   │ • Local Storage Fallback     │   │ • Hardhat Local Node  │
   │ • Pinata IPFS Adapter        │   │ • SHA-256 (bytes32)   │
   └──────────────────────────────┘   └───────────────────────┘
```

### Why This Design is Strong:
1. **Decoupled Verification**: Verifiers do not need an account or password. Anyone with the PDF can verify it.
2. **Zero Knowledge of Private Data on Blockchain**: We never store student phone numbers, marks, or personal addresses on the public blockchain. We only store the **SHA-256 document hash (`bytes32`)**.
3. **Resilient Fallback**: The app runs 100% offline without paid cloud services. It uses an embedded in-memory database and local file storage fallback.

---

## 3. Five-Minute Professor Demonstration Script

Follow these steps during your project viva:

### Minute 1: System Overview & Architecture (Landing Page)
1. Open the browser at `http://localhost:3000`.
2. Show the clean landing page.
3. Explain the problem: *"Degree fraud is rising worldwide. Centralized university verification portals often suffer downtime, and paper documents can be forged."*
4. Point out the three core actors: **Administrator**, **Educational Institution**, and **Student/Public Verifier**.

### Minute 2: Institution Login & AI-Assisted Certificate Issuance
1. Click **Sign In** and select **University / Institution** (or log in with `vc@gce-tveli.edu.in` / `UniversitySecret123`).
2. Go to **Issue Certificate**.
3. Point out the **AI-Assisted OCR extraction** box:
   - Click upload on a draft certificate image/PDF (`test-scanned-certificate.png`).
   - Show how the AI OCR parses the student's name (*Saqib Ahmad Bhat*), register number (*950020104001*), and course.
   - Explain: *"This saves clerical time, but requires administrative confirmation before minting."*
4. Click **Preview & Issue Certificate**.
5. Show the generated blockchain transaction and the unique **Blockchain ID** (e.g. `UN01-CERT-...`).

### Minute 3: Student View & PDF Download
1. Log out and sign in as a student (`saqib.student@gce.edu.in` / `StudentSecurePassword123`).
2. Show the student dashboard with the newly issued credential.
3. Click **Download Official PDF**.
4. Open the downloaded PDF:
   - Point out the formal academic layout.
   - Show the embedded **QR code** in the corner.
   - Show the cryptographic SHA-256 hash printed at the footer.

### Minute 4: The "Magic" Verification Test (Tamper Detection)
1. Open an Incognito window or click **Public Verification** in the navbar.
2. **Test 1 — Authentic Verification**:
   - Drag and drop the downloaded original PDF into the verifier box.
   - Click **Verify Certificate**.
   - Result: Instant **GREEN BADGE: AUTHENTIC**. Show that the hash matches the on-chain registry.
3. **Test 2 — Tamper Detection**:
   - Open the PDF in a text editor or use the test modified PDF (`tampered.pdf`).
   - Upload the modified file.
   - Result: Instant **RED BADGE: TAMPERING DETECTED**.
   - Explain to the professor: *"Even though the file looks almost identical, altering a single character causes the SHA-256 cryptographic avalanche effect, completely changing the hash. The blockchain rejects it immediately."*

### Minute 5: Certificate Revocation Workflow
1. Switch back to the Institution portal.
2. Locate the certificate and click **Revoke Certificate**.
3. Enter the reason: *"Administrative correction: Updated course syllabus"*.
4. Return to the Public Verifier and re-verify the original PDF or ID.
5. Result: Instant **AMBER/RED BADGE: REVOKED**, displaying the official reason and revocation timestamp.
6. Conclude: *"This proves complete lifecycle governance from issuance to revocation on the blockchain."*

---

## 4. Twenty Likely Professor Viva Questions & Answers

### Q1. What is the fundamental difference between storing a certificate in a database vs. on a blockchain?
> **Answer**: A centralized database (like MongoDB or SQL) can be silently modified or manipulated by anyone with root database credentials or via SQL injection. In contrast, a blockchain ledger is immutable. Once a certificate hash is recorded in a mined block, it cannot be altered, backdated, or deleted, even by the database administrator.

### Q2. Why did you store a SHA-256 hash (`bytes32`) instead of storing the entire PDF on the blockchain?
> **Answer**: Ethereum storage is extremely expensive (storing 1 MB on-chain could cost thousands of dollars in gas). Furthermore, public blockchains are transparent. Storing a 32-byte cryptographic SHA-256 hash (`bytes32`) costs less than \$0.02 in gas, provides zero-knowledge mathematical proof of the document's contents, and prevents student personally identifiable information (PII) from being exposed on a public network.

### Q3. What is the SHA-256 avalanche effect?
> **Answer**: The avalanche effect is a fundamental property of cryptographic hash functions where a tiny change in the input (such as flipping a single bit or changing a grade from 'B' to 'A') causes the resulting output hash to change drastically and unpredictably. This makes document tampering immediately detectable.

### Q4. How does your system support certificate revocation if the blockchain is immutable?
> **Answer**: We do not delete past blocks. Instead, our smart contract `CertificateRegistry.sol` maintains an internal `isRevoked` boolean and `revocationReason` string mapped to the `certificateId`. When the authorized issuing authority calls `revokeCertificate()`, the smart contract updates this status and emits a `CertificateRevoked` event. The history remains immutable, but the current status reflects revocation.

### Q5. Who is allowed to revoke a certificate?
> **Answer**: In our smart contract, only the **original issuing wallet address** or the **contract owner** is authorized to revoke a certificate (`require(msg.sender == cert.issuer || msg.sender == owner)`). Unauthorized third parties are rejected by the EVM.

### Q6. What is the role of Tesseract.js in your system?
> **Answer**: Tesseract.js is a client/server optical character recognition engine based on WebAssembly and neural networks. It automatically reads text from scanned physical certificates or transcript images and uses regular-expression heuristics to pre-fill candidate fields (Name, Registration Number, Degree). It serves as an administrative productivity assistant, not an automated legal fraud detector.

### Q7. Why did you not use a cloud AI API like OpenAI or Google Vision?
> **Answer**: Using commercial APIs introduces mandatory recurring financial costs, internet dependencies, and potential data privacy concerns when uploading educational credentials. Tesseract.js runs 100% locally on the machine with zero recurring cost and zero external network leakage.

### Q8. What happens if an institution's internet goes down or IPFS is slow?
> **Answer**: We implemented a hybrid storage architecture. When cloud IPFS credentials (Pinata) are absent or unreachable, the system automatically falls back to deterministic local file storage (`backend/uploads/certificates/`). The SHA-256 hash computation remains identical regardless of the storage backend.

### Q9. How do you prevent unauthorized institutions from issuing valid certificates?
> **Answer**: We enforce two layers of security:
> 1. **Application Layer**: Express JWT middleware checks user roles. New institutions must be approved by the system administrator before their account is activated.
> 2. **Smart Contract Layer**: The contract enforces an `onlyAuthorized` modifier. Issuance transactions from wallet addresses not explicitly whitelisted by the contract owner will revert.

### Q10. What does the QR code on the certificate contain?
> **Answer**: The QR code encodes a signed direct URL pointing to the public verification endpoint (e.g., `http://localhost:3000/verify?id=UN01-CERT-...`). Scanning the QR code with any smartphone camera immediately opens the verified credentials view without requiring special apps.

### Q11. Can an attacker generate their own valid certificate if they download your frontend code?
> **Answer**: No. The frontend is merely a presentation layer. Certificate minting requires a signed blockchain transaction from an authorized Ethereum private key and a signed JWT token from the backend. A rogue client cannot mint valid records on the smart contract.

### Q12. Why did you configure the backend on port 5001 instead of 5000?
> **Answer**: On macOS Monterey and later, Apple's AirPlay Receiver daemon (`ControlCenter`) listens on port 5000 by default. Binding an Express server to port 5000 results in an `EADDRINUSE` collision. We isolated the API to port 5001 across all proxies and environment configurations.

### Q13. Why did you use `bytes32` instead of `string` for the document hash in Solidity?
> **Answer**: In Solidity, dynamic `string` types require heap allocation, complex character encoding, and higher gas consumption. A SHA-256 digest is always exactly 256 bits (32 bytes). Using the primitive `bytes32` type reduces gas costs by more than 40% and allows direct constant-time equality comparisons (`hash1 == hash2`).

### Q14. What is the purpose of `mongodb-memory-server` in your project?
> **Answer**: It allows the application to execute self-contained automated tests and live academic demonstrations on any computer without requiring the user to install or configure an external MongoDB database daemon.

### Q15. How do you prevent Server-Side Template Injection (SSTI) during certificate generation?
> **Answer**: Certificate templates are strictly managed on the server side using predefined EJS layouts. Arbitrary anonymous users cannot upload executable template files. Dynamic values are escaped and sanitized by the template engine.

### Q16. What is the difference between encryption and hashing?
> **Answer**: Encryption is a two-way function where ciphertext can be decrypted back to plaintext using a secret key. Hashing is a one-way mathematical function where the original data cannot be reconstructed from the hash. We use hashing because we want proof of authenticity without exposing the original data.

### Q17. How does the PDF upload verification work?
> **Answer**: When an employer uploads a PDF:
> 1. The server reads the raw binary buffer of the uploaded file.
> 2. It computes the SHA-256 hash using Node's `crypto.createHash('sha256')`.
> 3. It queries the smart contract `verifyCertificate(id, computedHash)`.
> 4. If the computed hash matches the on-chain hash, the document is mathematically identical to the one issued.

### Q18. What are the gas costs associated with deploying this contract on a public Ethereum network?
> **Answer**: Deploying `CertificateRegistry.sol` costs approximately 600,000 gas, and each certificate issuance costs ~140,000 gas. While expensive on Ethereum L1 mainnet, deploying to Layer 2 rollups like Polygon, Arbitrum, or Base costs fractions of a cent per certificate, making large-scale institutional adoption practical.

### Q19. How did you handle security vulnerabilities in the inherited codebase?
> **Answer**: We conducted a comprehensive security audit:
> 1. Completely purged a leaked Ethereum private key in the upstream repository.
> 2. Removed plaintext password logging in console outputs.
> 3. Implemented JWT authentication and client-side route guards.
> 4. Configured CORS and sanitized uploaded file handling.
> 5. Added comprehensive `.gitignore` rules to prevent credential leakage.

### Q20. If you had six more months to develop this project, what would you add?
> **Answer**:
> 1. **Decentralized Identifiers (DIDs) and W3C Verifiable Credentials**: Standardizing the credential format across global academic consortia.
> 2. **Zero-Knowledge Proofs (ZK-SNARKs)**: Enabling students to prove specific attributes (such as *"GPA is above 8.0"* or *"graduated after 2024"*) without revealing their full marks or transcript.
> 3. **Layer 2 Rollup Deployment**: Deploying contracts on Arbitrum or Polygon with automated meta-transactions (EIP-2771) so universities do not need to manage gas tokens directly.

