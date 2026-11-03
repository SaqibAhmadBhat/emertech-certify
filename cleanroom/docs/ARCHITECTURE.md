# Emertech Certify — System Architecture (Clean-Room v2.0)

**Architect**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Department**: Computer Science and Engineering  

---

## 1. Architectural Philosophy

Emertech Certify implements a **decoupled, privacy-preserving, dual-layer cryptographic architecture**:

```
[ Tier 1: Client Layer ]
  ├── React 19 SPA (Original UI / Glassmorphism)
  ├── Web Crypto API (Client-side SHA-256 computation)
  └── Tesseract.js WebAssembly (Neural OCR engine)
          │
          ▼  (REST API v2 / JWT Bearer)
[ Tier 2: Application & API Layer ]
  ├── Node.js 22 & Express 4.18
  ├── CryptoService (Deterministic Canonicalization)
  ├── PdfVectorService (Direct PDF-Lib vector compilation)
  └── BlockchainService (Ethers.js Smart Contract interface)
          │
          ├── (Metadata & Persistence) ──────► [ Tier 3: Storage & Database ]
          │                                      ├── MongoDB / Memory Server
          │                                      └── Content-Addressed Local FS / IPFS
          │
          ▼  (JSON-RPC / Ethereum EVM)
[ Tier 4: Consensus & Blockchain Layer ]
  └── EmertechCertificateRegistry.sol (Solidity ^0.8.20)
       ├── mapping(bytes32 => CertificateRecord)
       ├── Reentrancy & Access Control
       └── Events: CertificateRegistered, CertificateRevoked
```

---

## 2. Core Architectural Invariants

### 1. Zero On-Chain Personally Identifiable Information (PII)
- The Ethereum smart contract only stores `bytes32 certHash`, `address issuer`, `uint64 issuedAt`, `uint64 revokedAt`, and `bool isRevoked`.
- Personal student data (name, roll number, CGPA, graduation date) is stored exclusively off-chain in canonical PDF files and encrypted records.
- Complies strictly with the European Union General Data Protection Regulation (GDPR) and the Digital Personal Data Protection Act (DPDP Act).

### 2. Deterministic Canonicalization (NIST FIPS 180-4)
- Academic records are normalized into an unambiguous, pipe-delimited format:
  `EMERTECHv2|INSTITUTION_CODE|STUDENT_ID|NAME|DEGREE|MAJOR|DATE|TIMESTAMP`
- SHA-256 computes a 256-bit hash. Any bit alteration changes the digest completely (avalanche effect).

### 3. Pure Vector PDF Generation
- Unlike legacy architectures using headless Chromium (Puppeteer) with high RAM overhead, Emertech Certify utilizes `pdf-lib` to synthesize vector PDF certificates directly in memory within milliseconds.
- High-resolution decorative security borders, university emblems, student metadata, micro-print patterns, and vector QR codes are stamped deterministically.

### 4. 4-Way Multi-Modal Verification
- **Mode 1 (Hash Direct)**: Verifiers query the 64-character hex hash directly against the smart contract.
- **Mode 2 (File Upload)**: Verifiers upload a PDF. The system computes its SHA-256 hash and compares it bitwise with the on-chain record. If a single grade is altered, `TAMPER_DETECTED` is flagged.
- **Mode 3 (QR Code)**: Verifiers scan the embedded certificate QR code to automatically open the verified record.
- **Mode 4 (AI Neural OCR)**: Verifiers upload photos of paper documents. Tesseract.js extracts textual entities to match against database records.
