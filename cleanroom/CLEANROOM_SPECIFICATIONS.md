# Emertech Certify — Functional & Technical Specifications
**Document Version**: 2.0.0-CLEANROOM  
**Architect**: Saqib Ahmad Bhat  
**Standards Reference**: NIST FIPS 180-4, W3C Verifiable Credentials Data Model v2.0, RFC 7519 (JWT), EVM Solidity ^0.8.20  

---

## 1. System Objectives & Architecture Principles

Emertech Certify is designed around four architectural pillars:

1. **Privacy-Preserving Dual-Layer Verification**:
   - Sensitive student Personally Identifiable Information (PII) such as full legal name, student registration number, cumulative grade point average (CGPA), and date of birth MUST NOT be written to the public blockchain.
   - Only a deterministic, 256-bit cryptographic digest (`bytes32 certHash`) derived from the canonical academic record is committed to the Ethereum ledger.
2. **Deterministic Tamper Resistance**:
   - Any modification of a single byte, pixel, or character in the generated certificate PDF alters the cryptographic checksum (NIST FIPS 180-4 avalanche effect), triggering an immediate verification failure.
3. **Multi-Modal Verification Independence**:
   - Verifiers must be able to authenticate a credential through four distinct mechanisms without requiring third-party API keys or Web3 wallet software:
     - File Upload (direct PDF binary SHA-256 calculation).
     - Direct Hex Hash Query (64-character hex lookup).
     - Cryptographic QR Code Scan (camera or image scan).
     - OCR Scan of Physical Paper Copies (client-side Tesseract.js).
4. **Decoupled Autonomous Storage**:
   - Documents are content-addressed and pinned to IPFS for global decentralized persistence, with an automated local storage fallback ensuring zero downtime when external IPFS gateways are unreachable.

---

## 2. Cryptographic Data Model & Canonicalization Standard

### 2.1 Canonical Payload Schema
To ensure deterministic hashing across heterogeneous environments (browsers, Node.js, command line), the academic record is serialized into a normalized, alphabetized pipe-delimited string before SHA-256 hashing:

```
CANONICAL_STRING = "CERTv2" + "|" +
                   INSTITUTION_ID.trim().toUpperCase() + "|" +
                   STUDENT_IDENTIFIER.trim().toUpperCase() + "|" +
                   DEGREE_TITLE.trim() + "|" +
                   MAJOR_PROGRAM.trim() + "|" +
                   GRADUATION_DATE.trim() + "|" +
                   ISSUANCE_TIMESTAMP.toString()
```

### 2.2 Hash Computation
```
certHash = "0x" + SHA256(CANONICAL_STRING).hex()
```
The resulting 32-byte hexadecimal hash is cast to `bytes32` for EVM smart contract transactions.

---

## 3. Smart Contract Specifications (`EmertechCertificateRegistry.sol`)

### 3.1 Contract Interface
- **Pragma**: `solidity ^0.8.20;`
- **Compiler Optimizations**: Runs = 200.

### 3.2 State Data Structures
```solidity
enum InstitutionStatus { Unregistered, Pending, Authorized, Suspended, Revoked }

struct InstitutionRecord {
    string name;
    string officialDomain;
    address walletAddress;
    InstitutionStatus status;
    uint64 registeredAt;
}

struct CertificateRecord {
    bytes32 certHash;
    address issuer;
    uint64 issuedAt;
    uint64 revokedAt;
    bool isRevoked;
    string recipientIdHash;
    string metadataURI;
}
```

### 3.3 Custom Errors
To minimize deployment and runtime gas overhead, the contract avoids revert strings and uses custom errors:
- `error NotContractOwner();`
- `error UnauthorizedInstitution();`
- `error CertificateAlreadyExists();`
- `error CertificateNotFound();`
- `error CertificateAlreadyRevoked();`
- `error InvalidAddress();`
- `error InvalidHash();`

### 3.4 Key Functions
1. `registerCertificate(bytes32 certHash, string calldata recipientIdHash, string calldata metadataURI) external`
   - Requires caller to be an `Authorized` institution.
   - Ensures `certHash` is non-zero and has not been registered previously.
   - Emits `CertificateRegistered(certHash, msg.sender, block.timestamp)`.
2. `revokeCertificate(bytes32 certHash, string calldata reason) external`
   - Requires caller to be the original issuing institution or the contract owner.
   - Ensures certificate exists and is not already revoked.
   - Sets `isRevoked = true` and records `revokedAt = block.timestamp`.
   - Emits `CertificateRevoked(certHash, msg.sender, block.timestamp, reason)`.
3. `verifyCertificate(bytes32 certHash) external view returns (bool exists, bool isRevoked, address issuer, uint64 issuedAt, uint64 revokedAt, string memory metadataURI)`
   - Pure constant view method ($O(1)$ EVM lookup).
4. `setInstitutionStatus(address institutionWallet, string calldata name, string calldata domain, InstitutionStatus status) external`
   - Restricted to `contractOwner`.

---

## 4. Backend Microservice Architecture

The backend is engineered as a clean, decoupled REST service:

### 4.1 Directory Structure
```
cleanroom/backend/
├── src/
│   ├── config/          # Environment, database, Web3 provider
│   ├── controllers/     # Auth, Institution, Certificate, Verify, Admin
│   ├── middleware/      # JWT auth, rate limiter, error handler
│   ├── models/          # User, Institution, Certificate, AuditEvent
│   ├── routes/          # RESTful routing endpoints
│   ├── services/        # Crypto, Blockchain, PDF Vector, OCR, Storage
│   └── app.js           # Express application initialization
├── test/                # Automated API & cryptographic test suite
└── package.json
```

### 4.2 Core Service Specifications
1. **`CryptoService`**: Pure cryptographic utilities: SHA-256 canonical hashing, salt generation, HMAC calculation.
2. **`BlockchainService`**: Ethers.js v6 abstraction layer for transaction submission, nonce tracking, gas estimation, and RPC query caching.
3. **`PdfVectorService`**: Direct vector PDF compilation using `pdf-lib` (embedded fonts, high-resolution institution seal, micro-print security borders, dynamic vector QR code embedding). Zero external headless Chrome dependency.
4. **`OcrService`**: Isolated Tesseract.js worker pool performing OCR on uploaded images with text normalization, noise reduction, and regex extraction.
5. **`StorageService`**: Storage manager supporting dual-mode persistence (Pinata IPFS gateway with transparent local filesystem fallback).

---

## 5. Frontend User Experience Specifications

### 5.1 Design System
- **Color Palette**:
  - Background: Deep Midnight Navy (`#0B0F19`) with translucent dark slate cards (`#111827`, `#1E293B`).
  - Accents: Electric Blue (`#38BDF8`), Deep Indigo (`#4F46E5`), Emerald Green (`#10B981`), Warm Amber (`#F59E0B`), Rose (`#F43F5E`).
  - Typography: Clean sans-serif (`Inter`, system UI font fallback) with monospace for cryptographic hashes (`JetBrains Mono`).
- **Brand Identity**:
  - Original SVG Logo: Cryptographic hexagon with embedded graduation mortarboard and verification check.

### 5.2 Key User Portals
1. **Public Verification Hub (`/verify`)**:
   - Unified tabbed layout: PDF File Drag-and-Drop, Hash Search, QR Camera Scanner, OCR Document Scan.
   - Immediate visual feedback: Diagnostic card showing calculated SHA-256, on-chain state, issuer wallet, timestamp, and tamper status.
2. **Institution Portal (`/institution`)**:
   - Certificate issuance form with live dynamic preview.
   - Batch CSV file ingestion.
   - Active certificate registry with search, filter, and on-chain revocation modal.
3. **Student Credential Portal (`/student`)**:
   - View enrolled degrees and issued certificates.
   - One-click official PDF download and verification link copying.
4. **Super Admin Console (`/admin`)**:
   - Institutional accreditation management.
   - Smart contract transaction telemetry.
