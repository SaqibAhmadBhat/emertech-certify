<div align="center">

# EMERTECH CERTIFY
### AI-Assisted Blockchain-Based Academic Certificate Verification System

[![Emertech Certify Clean-Room CI](https://github.com/SaqibAhmadBhat/emertech-certify/actions/workflows/ci.yml/badge.svg)](https://github.com/SaqibAhmadBhat/emertech-certify/actions/workflows/ci.yml)
[![Architecture: Clean-Room v2.0](https://img.shields.io/badge/Architecture-Clean--Room_v2.0-8B5CF6?style=for-the-badge&logo=codeforces)](cleanroom/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Solidity: ^0.8.20](https://img.shields.io/badge/Solidity-^0.8.20-363636?style=for-the-badge&logo=solidity)](cleanroom/contracts/contracts/EmertechCertificateRegistry.sol)
[![React: 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](cleanroom/frontend/)
[![Node: >=18](https://img.shields.io/badge/Node->=18-339933?style=for-the-badge&logo=node.js)](package.json)

<br />

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="assets/emertech-certify-hero.png">
  <img src="assets/emertech-certify-hero.gif" alt="Emertech Certify Hero Animation" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</picture>

<br />
<br />

**A privacy-preserving hybrid credential verification platform uniting Ethereum smart contracts, deterministic SHA-256 digests, pure vector PDF compilation, content-addressed storage, and Tesseract.js neural OCR.**

[🚀 Clean-Room v2.0 Quickstart](#-clean-room-v20-quickstart-recommended) &bull;
[🏛️ v1 vs v2 Architecture](#-repository-architecture-v20-primary-vs-v10-historical) &bull;
[🔬 Provenance Audit](cleanroom/docs/PROVENANCE_AUDIT.md) &bull;
[Interactive Presentation](presentation/index.html) &bull;
[Architecture Guide](cleanroom/docs/ARCHITECTURE.md) &bull;
[Academic Identity](#-academic-identity-mentorship--attribution)

</div>

---

## 🌟 Executive Summary: Clean-Room v2.0 Primary Architecture

**Emertech Certify** is an academic software demonstration and research project engineered by **Saqib Ahmad Bhat** (Department of Computer Science and Engineering, **Government College of Engineering, Tirunelveli**) designed to evaluate decentralized credential verification, tamper detection, and privacy preservation.

### Evolutionary Repository Structure
1. **Primary Production Implementation (v2.0 Clean-Room)** in [`cleanroom/`](cleanroom/): An **independently developed**, ground-up clean-room software architecture. Every Solidity smart contract, Express backend controller, Mongoose schema, pure vector PDF generator, neural OCR pipeline, and React 19 component was authored from scratch by Saqib Ahmad Bhat using open standards (NIST FIPS 180-4, W3C Verifiable Credentials, RFC 7519, and EVM Solidity ^0.8.20).
2. **Historical Prototype (v1.0 Security-Hardened)** in root directories (`/backend`, `/contracts`, `/frontend`): The original pedagogical prototype adapted from the open-source **Certiport** repository by Alwin James (MIT License). It has been comprehensively audited to remediate critical upstream vulnerabilities (such as eliminating hardcoded Ethereum private keys and plaintext credential logging) and is retained solely for historical provenance and academic audit comparison.

---

## 📊 Repository Architecture: v2.0 Primary vs. v1.0 Historical

| Dimension | Primary Implementation: Clean-Room v2.0 (`cleanroom/`) | Historical Prototype: Hardened v1.0 (`/`) |
|---|---|---|
| **Directory Location** | [`cleanroom/`](cleanroom/) | Root (`/backend`, `/contracts`, `/frontend`) |
| **Authorship & Provenance** | **100% Independently Authored** by Saqib Ahmad Bhat | Upstream Certiport baseline by Alwin James (Remediated) |
| **Smart Contract** | `EmertechCertificateRegistry.sol` (Solidity ^0.8.20, gas-packed structs, custom errors, $O(1)$ mapping) | `CertificateRegistry.sol` (Solidity ^0.8.19, string lookup with SHA-256 hash patch) |
| **Contract Unit Tests** | **14 / 14 Passing** (Deployment, Auth, Duplicate, Revocation) | 9 / 9 Passing |
| **Backend Integration Tests** | **37 / 37 Passing on Live EVM Node** (NIST KAT, KeyVault PBKDF2/AES-256-GCM, one-time bootstrap, privilege escalation rejection, least-privilege STUDENT with identity barrier, student enrollment claim token, institutional signing, persistent non-RPC key custody, failure preservation invariants, multi-tenant isolation, magic byte validation, 4 verification modes, OCR fixture) | 18 / 18 Passing (Legacy routes & templates) |
| **PDF Generation Engine** | **Pure Vector Memory Compilation** via `pdf-lib` (Zero Chromium overhead) | Headless Chromium via Puppeteer (High RAM overhead) |
| **Frontend Framework** | **React 19** with custom glassmorphism & original SVG branding | React 18 with legacy dashboard layouts |
| **Storage & Persistence** | Dual-mode: Content-Addressed Local FS + IPFS Pinata adapter | Local uploads directory + Pinata API |
| **Automated Fallbacks** | Auto in-memory MongoDB (`mongodb-memory-server`) + offline demonstration mode (`OFFCHAIN_DEMO`) | Requires live external MongoDB & local Hardhat node |

---

## ⚡ Clean-Room v2.0 Quickstart (Recommended)

The clean-room v2.0 implementation is completely self-contained within the `cleanroom/` directory.

### 1. Execute All Automated Tests
Run the clean-room test suite (14 smart contract tests + 37 backend integration tests executed on a live local EVM node):

```bash
# Clone the repository
git clone https://github.com/SaqibAhmadBhat/emertech-certify.git
cd emertech-certify/cleanroom

# Run the complete automated test suite
npm run test:all
```

#### Terminal Evidence: Clean-Room Smart Contracts (14/14 Passing)
```
  EmertechCertificateRegistry (Clean-Room Architecture)
    1. Deployment & Administrative Authority
      ✔ Should correctly assign the contract owner
      ✔ Should automatically authorize the deployer as a root authority
      ✔ Should allow the owner to authorize an academic institution
      ✔ Should prevent non-owners from updating institution authorization
    2. Certificate Registration & Hashing
      ✔ Should permit an authorized institution to register a certificate
      ✔ Should reject registration with a zero hash
      ✔ Should prevent duplicate certificate registration
      ✔ Should reject issuance from an unauthorized institution
    3. Verification State & Diagnostics
      ✔ Should correctly verify an authentic certificate hash
      ✔ Should return non-existent state for an unregistered certificate
    4. Revocation Lifecycle
      ✔ Should allow the issuing institution to revoke a certificate
      ✔ Should allow the contract owner to revoke a certificate in emergencies
      ✔ Should prevent unauthorized third parties from revoking certificates
      ✔ Should reject revoking an already revoked certificate

  14 passing (791ms)
```

#### Terminal Evidence: Backend Integration Tests with Local Hardhat EVM Integration (37/37 Passing)
```
================================================================
🧪 EMERTECH CERTIFY CLEAN-ROOM v2.0 INTEGRATION TEST SUITE
🏛️ Academic Fixture: Apex Institute of Technology (AIT)
🔗 On-Chain Consensus: Real Local Hardhat EVM Execution
================================================================
1. Testing System Health Check (/api/v2/health)...            ✅ Health check verified.
2. Testing SHA-256 NIST Known-Answer Tests & Keccak...       ✅ NIST vectors passed; distinct from Keccak.
2B. Testing KeyVault Cryptographic Invariants...             ✅ Verified (PBKDF2/AES-256-GCM, salt, tamper resistance).
3. Testing One-Time Super Admin Bootstrap via CLI Logic...   ✅ Super Admin password policy enforced.
4. Testing Enforcement of One-Time Bootstrap Invariant...    ✅ Multiple bootstraps safely rejected.
5. Testing Privilege Escalation Rejection (SUPER_ADMIN)...   ✅ Rejected with 403 Forbidden.
6. Testing Privilege Escalation Rejection (INST_ADMIN)...    ✅ Rejected with 403 Forbidden.
7. Testing Public Registration Least-Privilege STUDENT...    ✅ Student role & identity verification barrier enforced.
8. Testing Academic Institution Application Queue...         ✅ Institution application queued.
9. Testing Super Admin Approval & On-Chain Status...         ✅ Institution accredited on-chain.
10. Testing Rejection of Invalid Wallet Authorization...      ✅ Failed authorization rejected (400).
11. Testing Handling of Unavailable Blockchain (502)...       ✅ Safe 502 Bad Gateway response.
12. Testing Institution Status Transition to SUSPENDED...     ✅ Suspension failure invariant & status 3 verified.
13. Testing Prevention of Issuance by Suspended Inst...       ✅ Blocked with 403 Forbidden.
14. Testing Restoration of Institution to AUTHORIZED...      ✅ Restored on smart contract.
15. Testing Protected Institution Admin Provisioning...       ✅ Provisioned by Super Admin.
16. Testing Prevention of Admin Provisioning by Student...   ✅ Rejected with 403 Forbidden.
17. Testing Provisioning Guard for Unaccredited Inst...      ✅ Safely rejected with 400 Bad Request.
18. Testing Negative RBAC: Student Blocked from Issuance...  ✅ Blocked with 403 Forbidden.
18B. Testing Student Enrollment Token Generation & Claim...   ✅ Cryptographic enrollment claim verified.
19. Testing Persistent Key Custody (AES-256-GCM / PBKDF2)... ✅ Encrypted DB storage & signer recovery verified.
20. Testing Certificate Issuance & Real EVM Anchoring...     ✅ Certificate anchored on-chain with mined tx!
20B. Testing Real Persistent Institutional Key Custody...     ✅ Non-RPC decrypted key signed EVM tx mined!
21. Testing Vector PDF Download Endpoint...                  ✅ Vector PDF downloaded.
22. Testing Mode 1: Public Verification by Hash...          ✅ Mode 1 Verified: AUTHENTIC (onChain: true).
23. Testing Mode 2: Verification by PDF Upload...           ✅ Mode 2 Verified: Digest matches (onChain: true).
24. Testing Bitwise Tamper Detection on Altered PDF...      ✅ Tamper Detection Verified: TAMPER_DETECTED flagged.
25. Testing Mode 3: QR Code Payload Verification...         ✅ Mode 3 Verified: QR resolved on-chain.
26. Testing Student Credential Retrieval...                 ✅ Transcripts retrieved (verified identity).
27. Testing Multi-Tenant Revocation Isolation (RBAC)...      ✅ Cross-institution revocation blocked (403).
28. Testing Real On-Chain Certificate Revocation...         ✅ Revocation failure invariant & mined revocation verified.
29. Testing Prevention of Unauthorized Revocation...         ✅ Blocked with 403 Forbidden.
30. Testing Public Verification of Revoked Credential...    ✅ Revocation confirmed: REVOKED.
31. Testing Mode 4: Tesseract.js WebAssembly OCR...          ✅ Mode 4 Verified: Entities extracted from fixture.
32. Testing File Upload Magic Byte Enforcement...           ✅ Invalid headers rejected (400 Bad Request).
33. Testing Batch Certificate Issuance (Real EVM)...        ✅ Batch issuance processed 2 certs on-chain.
34. Testing Super Admin Telemetry & Governance...           ✅ Telemetry verified.

================================================================
📊 CLEAN-ROOM v2.0 TEST EXECUTION SUMMARY:
   Passed:  37
   Failed:  0
   Skipped: 0
================================================================
🎉 ALL CLEAN-ROOM TESTS PASSED WITH 100% SUCCESS ON REAL EVM LEDGER!
```

### 2. Start the Clean-Room Full Stack Locally

```bash
# Terminal 1: Start Smart Contract Local Node & Deploy
cd cleanroom/contracts
npx hardhat node
# In a second tab:
npx hardhat run scripts/deploy.js --network localhost

# Terminal 2: Launch Backend API Microservice (Port 5001)
cd cleanroom/backend
npm start

# Terminal 3: Launch React 19 Frontend Web Portal (Port 3000)
cd cleanroom/frontend
npm start
```
Open **`http://localhost:3000`** in your browser to interact with the clean-room web portal.

---

## 🔒 Cryptographic Foundations & Dual-Layer Verification

Emertech Certify enforces a strict **dual-layer verification paradigm** balancing privacy with decentralized non-repudiation:

```
[ Tier 1: Client Verification Layer ]
  ├── React 19 Single Page Application (Glassmorphic Design System)
  ├── Web Crypto API (Client-side SHA-256 calculation)
  └── Tesseract.js WebAssembly (Client-side neural OCR engine)
          │
          ▼  (REST API v2 / JWT Bearer Authorization)
[ Tier 2: Application Microservice ]
  ├── Node.js 22 & Express 4.18
  ├── CryptoService (Deterministic Pipe Canonicalization)
  ├── PdfVectorService (Direct PDF-Lib vector compilation)
  └── BlockchainService (Ethers.js EVM interface)
          │
          ├── (Metadata & Off-Chain Persistence) ──► [ Tier 3: Storage & Database ]
          │                                            ├── MongoDB (or In-Memory Fallback)
          │                                            └── Content-Addressed Local FS / IPFS
          │
          ▼  (JSON-RPC / Ethereum EVM)
[ Tier 4: Consensus & Blockchain Ledger ]
  └── EmertechCertificateRegistry.sol (Solidity ^0.8.20)
       ├── mapping(bytes32 => CertificateRecord)
       ├── Role-based Institutional Access Control
       └── Events: CertificateRegistered, CertificateRevoked
```

### 1. Privacy by Design: Exact On-Chain Data Model
To minimize personal data exposure in accordance with data minimization principles, **zero Personally Identifiable Information (PII)** is ever committed to the blockchain.

The on-chain struct `CertificateRecord` stores strictly:
- `bytes32 certHash`: 32-byte cryptographic SHA-256 digest of the canonical document payload.
- `address issuer`: Ethereum wallet address of the accredited issuing university.
- `uint64 issuedAt`: Block timestamp of credential issuance.
- `uint64 revokedAt`: Block timestamp of revocation (0 if currently active).
- `bool isRevoked`: Boolean flag reflecting revocation status.
- `string recipientIdHash`: Pseudonymized, high-entropy salted SHA-256 hash (`SHA-256(studentId + ":" + salt)`).
- `string metadataURI`: Content-addressed IPFS URI (`ipfs://...`) or local content reference.

> **Zero PII Confirmation**: Student legal names, letter grades, GPAs, and demographic records are strictly excluded from the blockchain ledger.

### 2. High-Entropy Salting for Pseudonymity
Because student registration identifiers frequently follow predictable sequential patterns, storing unsalted hashes would allow offline enumeration attacks. Emertech Certify generates a 128-bit cryptographically secure random salt for each certificate (`recipientSalt`), storing the salt off-chain and anchoring only the salted digest on-chain. This provides robust pseudonymization, though not total anonymity.

### 3. Deterministic Canonicalization (NIST FIPS 180-4)
To ensure identical cryptographic digests across heterogeneous environments, academic records are serialized using an unambiguous, pipe-delimited canonical standard before hashing:

$$\text{CanonicalString} = \text{"EMERTECHv2"} \mathbin{\Vert} \text{INSTITUTION\_CODE} \mathbin{\Vert} \text{STUDENT\_ID} \mathbin{\Vert} \text{NAME} \mathbin{\Vert} \text{DEGREE} \mathbin{\Vert} \text{MAJOR} \mathbin{\Vert} \text{DATE} \mathbin{\Vert} \text{TIMESTAMP}$$

$$\text{certHash} = \text{"0x"} \mathbin{\Vert} \text{SHA256}(\text{CanonicalString})$$

Any modification to a single character, date, or grade alters the digest completely (avalanche effect), triggering an immediate verification failure.

### 4. Cryptographic Tamper-Evidence vs. Real-World Authenticity
- **Mathematical Tamper-Evidence**: Verification proves that the presented certificate PDF exactly matches the SHA-256 digest anchored by the university's registered Ethereum address at the recorded block timestamp.
- **Operational Boundary**: Cryptographic verification proves that an authorized institution's private key signed the certificate hash; it cannot independently certify the physical or real-world truthfulness of claims made by an institution if an authorized private key is misused or compromised. Institutional key custody remains a critical operational prerequisite.

---

## 🔍 Multi-Modal Verification Matrix & Performance Profiles

| Verification Mode | Input Mechanism | Processing Pipeline | Target Environment | Performance Characteristics |
|---|---|---|---|---|
| **Mode 1: Direct Hash** | 64-char Hex Hash | Direct constant-time EVM mapping lookup `certificates[certHash]` | Web portal, API clients | Constant-time $O(1)$ EVM query. Public RPC latency governed by network round-trip time. |
| **Mode 2: PDF Binary** | Uploaded `.pdf` File | Binary SHA-256 buffer hash computed and matched against on-chain state | Employers, HR portals | Streaming binary digest computation + on-chain lookup. |
| **Mode 3: QR Payload** | Scanned 2D QR Code | Decodes embedded URL parameter, queries smart contract status | Smartphone camera | URL parameter resolution + smart contract query. |
| **Mode 4: Tesseract.js WebAssembly OCR** | Scanned Image / Photo | Tesseract.js WebAssembly worker parses text, extracts ID, resolves hash | Physical paper verification | Client-side WASM execution; speed depends on client CPU cores. |

---

## 🛠️ Storage & Database Fallback Architecture

To ensure continuous operation during academic demonstrations, local evaluations, or cloud outages, the system implements a tiered persistence architecture:

| Subsystem | Production Target | Development / Offline Fallback | Fallback Trigger Condition |
|---|---|---|---|
| **Relational Database** | MongoDB Atlas Cluster | In-Memory MongoDB (`mongodb-memory-server`) | External `MONGO_URI` unreachable or unconfigured |
| **Document Storage** | IPFS Gateway (Pinata API) | Local Filesystem Storage (`cleanroom/backend/storage/certificates/`) | Missing Pinata API credentials |
| **Consensus RPC** | Ethereum Node / Infura / Alchemy | Local JSON-RPC Node / Unlocked Signers | Ethereum JSON-RPC endpoint offline or unreachable |

> **Operational Boundary**: These fallback mechanisms are engineered for zero-dependency local evaluation and academic testing; production deployments require dedicated MongoDB clusters, pinned IPFS storage nodes, and reliable Ethereum RPC gateways.

---

## 📁 Repository Structure

```
emertech-certify/
├── cleanroom/                       # ★ PRIMARY INDEPENDENT v2.0 IMPLEMENTATION
│   ├── LICENSE                      # Scoped MIT License for Clean-Room Implementation
│   ├── contracts/                   # Solidity ^0.8.20 Smart Contracts (Hardhat, 14 Tests)
│   │   ├── contracts/EmertechCertificateRegistry.sol
│   │   └── test/EmertechCertificateRegistry.test.js
│   ├── backend/                     # Decoupled Node.js/Express REST API (19 Integration Tests)
│   │   ├── src/services/            # Crypto, Blockchain, PdfVector, OCR, Storage
│   │   └── test/                    # Live EVM Integration Suite & Synthetic OCR Fixture
│   ├── frontend/                    # React 19 SPA (Glassmorphic Design, SVG Branding)
│   ├── docs/                        # Complete Technical Documentation Suite
│   │   ├── ARCHITECTURE.md          # Four-tier system architecture
│   │   ├── PROVENANCE_AUDIT.md      # Empirical source code overlap analysis
│   │   ├── PROVENANCE_OUTPUT.txt    # Reproducible scan output
│   │   ├── file_hashes.json         # Cryptographic hashes of all cleanroom source files
│   │   ├── SECURITY.md              # Threat modeling and privacy policy
│   │   ├── SMART_CONTRACTS.md       # EVM specifications and gas optimization
│   │   ├── API_DOCUMENTATION.md     # RESTful v2 API specifications
│   │   ├── TESTING.md               # Automated testing guide
│   │   └── EXPORT_STRATEGY.md       # Clean separation & standalone repository plan
│   ├── tools/                       # Reproducible audit and scanning scripts
│   │   └── provenance_scan.py       # Empirical block-level comparison tool
│   ├── CLEANROOM_AUDIT.md           # 5-checkpoint formal audit with test evidence
│   └── CLEANROOM_SPECIFICATIONS.md  # Standards-based requirements specifications
│
├── contracts/                       # Historical v1 Smart Contracts (Hardened CertificateRegistry.sol)
├── backend/                         # Historical v1 Express Backend (Remediated controllers)
├── frontend/certiport-frontend/     # Historical v1 React Frontend
├── assets/                          # Architectural diagrams, animations, and screenshots
├── presentation/                    # Standalone HTML5/CSS3 presentation slide deck
├── .github/workflows/ci.yml         # Primary GitHub Actions CI testing cleanroom subprojects
├── .github/workflows/historical-v1.yml # Archival workflow for historical prototype
├── NOTICE.md                        # Historical attribution to upstream Certiport baseline
└── LICENSE                          # Unified MIT License with dual copyright scopes
```

---

## 🔬 Provenance & Intellectual Property Audit

A reproducible automated scan tool ([`cleanroom/tools/provenance_scan.py`](cleanroom/tools/provenance_scan.py)) was executed comparing all **66 clean-room source files** against the **79 legacy Certiport files**:

| Component | Independent Clean-Room Code | Overlap with Legacy Certiport | Overlap Nature |
|---|---|---|---|
| **Smart Contracts** | **100% Independent** | 0 lines copied | Non-copyrightable Solidity idioms (`modifier onlyOwner()`) |
| **Backend Services** | **100% Independent** | 0 lines copied | Standard Express/Mongoose keywords (`type: String`, `express.Router()`) |
| **Frontend UI** | **100% Independent** | 0 lines copied | Standard React conventions (`e.preventDefault()`, CSS resets) |
| **Branding & Assets** | **100% Independent** | 0 lines copied | Original SVG vector logo, glassmorphic dark palette |

For the full line-by-line audit and empirical token analysis, refer to [`cleanroom/docs/PROVENANCE_AUDIT.md`](cleanroom/docs/PROVENANCE_AUDIT.md).

---

## 🎓 Academic Identity, Mentorship & Attribution

### Maintainer & Author
- **Developer**: **Saqib Ahmad Bhat**
- **Degree Program**: Bachelor of Engineering (B.E.), Computer Science and Engineering
- **Institution**: **Government College of Engineering, Tirunelveli** (Tamil Nadu, India)
- **Role Referenced by Internship Certificate**: AI and Blockchain Engineer Intern

### Industry Inspiration & Context
- **Organization**: Emertech Innovations Private Limited ([https://emertech.io/](https://emertech.io/))
- **Industry Precedents Cited**: Emertech's public enterprise case studies—including the Apollo Tyres EUDR compliance architecture and Sahyadri Farms agro-traceability—demonstrate the real-world power of anchoring off-chain cryptographic digests on distributed ledgers.

> [!IMPORTANT]
> **Formal Academic Disclaimer**:  
> - Emertech Certify is an **independent academic project** authored by Saqib Ahmad Bhat for educational and research demonstration purposes.  
> - Emertech Innovations Private Limited **does not officially own, sponsor, fund, or commercially endorse** this software repository.  
> - Saqib Ahmad Bhat **did not personally build** the enterprise production systems of Apollo Tyres or Sahyadri Farms; those are cited strictly as external industry context.  
> - Saqib Ahmad Bhat does not claim original authorship of the historical upstream Certiport baseline. Upstream copyright and MIT licensing are preserved in full.



---

## 📜 Citation & License

### Software License
This repository is licensed under the **MIT License** with clear delineation between upstream and clean-room scopes — see the [LICENSE](LICENSE) file for details. Upstream attribution is recorded in [NOTICE.md](NOTICE.md). The independent v2.0 cleanroom implementation is separately licensed in [`cleanroom/LICENSE`](cleanroom/LICENSE).

### Academic Citation (BibTeX)
```bibtex
@software{bhat2026emertechcertify,
  author = {Bhat, Saqib Ahmad},
  title = {Emertech Certify: AI-Assisted Blockchain-Based Academic Certificate Verification System},
  year = {2026},
  url = {https://github.com/SaqibAhmadBhat/emertech-certify},
  note = {Government College of Engineering, Tirunelveli - Department of Computer Science and Engineering}
}
```
For standard Citation File Format, see [`CITATION.cff`](CITATION.cff).
