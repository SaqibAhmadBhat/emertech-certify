# Emertech Certify — System Architecture (Clean-Room v2.0)

**Architect**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Department**: Computer Science and Engineering  
**Academic Context**: AI and Blockchain Engineering Intern Demonstration  

---

## 1. Architectural Philosophy: Hybrid Decentralized Design

Emertech Certify implements a **hybrid decentralized architecture** engineered for academic credential integrity:

```
[ Tier 1: Client Verification Layer ]
  ├── React 19 SPA (Original UI / Glassmorphism)
  ├── Web Crypto API (Client-side SHA-256 computation)
  └── Tesseract.js WebAssembly (Tesseract.js WebAssembly OCR engine)
          │
          ▼  (REST API v2 / JWT Bearer)
[ Tier 2: Application & API Layer ]
  ├── Node.js 22 & Express 4.18
  ├── CryptoService (Deterministic Canonicalization)
  ├── PdfVectorService (Direct PDF-Lib vector compilation)
  └── BlockchainService (Ethers.js Smart Contract interface)
          │
          ├── (Off-Chain Metadata & Persistence) ──────► [ Tier 3: Storage & Database ]
          │                                                ├── MongoDB (Primary) / In-Memory Fallback
          │                                                └── Content-Addressed Local FS / IPFS
          │
          ▼  (JSON-RPC / Ethereum EVM)
[ Tier 4: Consensus & Blockchain Ledger ]
  └── EmertechCertificateRegistry.sol (Solidity ^0.8.20)
       ├── mapping(bytes32 => CertificateRecord)
       ├── Institutional Access Control
       └── Events: CertificateRegistered, CertificateRevoked
```

### Architectural Classification
- **Decentralized Verification**: Anyone can verify certificate validity, timestamp, and issuer address against the blockchain ledger without requiring API keys, central gatekeepers, or proprietary software.
- **Institutional Governance**: Credential issuance authority is restricted to authorized academic institutions vetted by the contract owner.
- **Operational Flexibility & Offline Fallback**: Development and testing environments benefit from embedded in-memory MongoDB and local filesystem storage. When the blockchain JSON-RPC node is unreachable, the system enters offline demonstration mode (`OFFCHAIN_DEMO`), persisting records in MongoDB while transparently notifying verification clients that on-chain consensus was not executed.

---

## 2. Cryptographic & Data Integrity Invariants

### 2.1 On-Chain Data Model (Strict Privacy by Design)
To minimize personal data exposure and facilitate alignment with international privacy principles (including GDPR Article 5(1)(c) data minimization and the India DPDP Act), **zero Personally Identifiable Information (PII)** is ever committed to the blockchain.

The smart contract `EmertechCertificateRegistry.sol` stores exclusively the following packed struct:

```solidity
struct CertificateRecord {
    bytes32 certHash;          // 256-bit SHA-256 digest of the canonical document payload
    address issuer;            // Ethereum wallet address of the accredited issuing university
    uint64 issuedAt;           // EVM block timestamp of issuance
    uint64 revokedAt;          // EVM block timestamp of revocation (0 if active)
    bool isRevoked;            // Boolean flag indicating revocation status
    string recipientIdHash;    // SHA-256 pseudonymized hash of the student identifier
    string metadataURI;        // Content-addressed URI (ipfs:// or local content reference)
}
```

> **Data Privacy Guarantee**: Student legal names, roll numbers, marks, grade point averages (CGPA), and dates of birth are NEVER written to the blockchain. They reside solely in off-chain database records and the canonical vector PDF.

### 2.2 Deterministic Canonicalization (NIST FIPS 180-4)
To ensure identical cryptographic digests across heterogeneous environments, academic records are serialized using an unambiguous, pipe-delimited canonical standard before hashing:

$$\text{CanonicalString} = \text{"EMERTECHv2"} \mathbin{\Vert} \text{INSTITUTION\_CODE} \mathbin{\Vert} \text{STUDENT\_ID} \mathbin{\Vert} \text{NAME} \mathbin{\Vert} \text{DEGREE} \mathbin{\Vert} \text{MAJOR} \mathbin{\Vert} \text{DATE} \mathbin{\Vert} \text{TIMESTAMP}$$

$$\text{certHash} = \text{"0x"} \mathbin{\Vert} \text{SHA256}(\text{CanonicalString})$$

Any modification to a single character, date, or grade alters the digest completely (avalanche effect), triggering an immediate verification failure.

### 2.3 Cryptographic Integrity vs. Real-World Authenticity
- **Tamper Evidence & Non-Repudiation**: Verification mathematically proves that the presented certificate matches the hash and issuing wallet address recorded on-chain at the recorded block timestamp. Any post-issuance tampering is mathematically impossible to conceal.
- **Scope Limitation**: Cryptographic verification proves that an authorized institution's key signed the certificate hash; it cannot independently certify the real-world truthfulness of claims made by an authorized institution if the private key was compromised or misused. Institutional key custody remains a critical operational prerequisite.

---

## 3. High-Performance Vector PDF Generation

Unlike legacy architectures that rely on headless Chromium (Puppeteer)—which consumes hundreds of megabytes of RAM and introduces process management overhead—Emertech Certify utilizes pure `pdf-lib` vector compilation:
- **Direct Memory Synthesis**: Compiles complete vector PDF documents directly in Node.js buffers in under 50 milliseconds.
- **Security Features**: Embedded micro-print border patterns, official university seals, metadata properties (`Title`, `Subject`), and dynamic 2D vector QR codes linking directly to public verification endpoints.

---

## 4. Multi-Modal Verification Matrix & Latency Characteristics

| Verification Mode | Input Mechanism | Processing Pipeline | Target Environment | Latency Profile |
|---|---|---|---|---|
| **Mode 1: Direct Hash** | 64-char Hex Hash | Direct constant-time EVM mapping lookup `certificates[certHash]` | Web portal, API clients | **Local Test Benchmark**: < 50ms<br>**Public RPC**: 200ms–1.5s (depends on network RTT) |
| **Mode 2: PDF Binary** | Uploaded `.pdf` File | Binary SHA-256 buffer hash computed and matched against on-chain state | Employers, HR portals | **Local Test Benchmark**: < 80ms<br>**Public RPC**: 300ms–2.0s |
| **Mode 3: QR Payload** | Scanned 2D QR Code | Decodes embedded URL parameter, queries smart contract status | Smartphone camera | **Local Test Benchmark**: < 60ms<br>**Public RPC**: 250ms–1.8s |
| **Mode 4: Tesseract.js WebAssembly OCR** | Scanned Image / Photo | Tesseract.js WebAssembly worker parses text, extracts ID, resolves hash | Physical paper verification | **Local Client Benchmark**: 1.2s–3.5s (depends on CPU WASM threads) |

> **Latency Disclosure**: Sub-500ms verification is an observed benchmark in local and low-latency testing environments. On public networks (e.g. Ethereum Sepolia, Polygon), verification latency is governed by JSON-RPC node round-trip times and network congestion.

---

## 5. Storage & Database Fallback Architecture

To ensure continuous operation during academic demonstrations, local evaluations, or cloud outages, the system implements a tiered persistence architecture:

### 5.1 Primary vs. Development Fallbacks

| Subsystem | Production Target | Development / Offline Fallback | Fallback Trigger Condition |
|---|---|---|---|
| **Relational Database** | MongoDB Atlas Cluster | In-Memory MongoDB (`mongodb-memory-server`) | External `MONGO_URI` unreachable or unconfigured |
| **Document Storage** | IPFS Gateway (Pinata API) | Local Filesystem Storage (`backend/storage/certificates/`) | Missing Pinata API credentials |
| **Consensus RPC** | Ethereum Node / Infura / Alchemy | Local In-Memory Fallback Ledger | Ethereum JSON-RPC endpoint offline or unreachable |

> **Operational Boundary**: These fallback mechanisms are engineered for zero-dependency local evaluation and academic testing; production deployments require dedicated MongoDB clusters, pinned IPFS storage nodes, and reliable Ethereum RPC gateways.
