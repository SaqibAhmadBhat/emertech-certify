# EMERTECH CERTIFY (v2.0 Clean-Room Architecture)
### AI-Assisted Blockchain-Based Academic Certificate Verification System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity)](contracts/contracts/EmertechCertificateRegistry.sol)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19.4-FFF100?logo=ethereum)](contracts/hardhat.config.js)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](frontend/package.json)
[![Node](https://img.shields.io/badge/Node->=18.0.0-339933?logo=node.js)](package.json)
[![Contract Tests](https://img.shields.io/badge/Contract_Tests-14%2F14_Passing-10B981)](contracts/test/)
[![Backend Tests](https://img.shields.io/badge/Backend_Tests-18%2F18_Passing-10B981)](backend/test/)
[![Frontend Build](https://img.shields.io/badge/Frontend_Build-Passing-10B981)](frontend/)

An independent, clean-room decentralized credential verification architecture engineered from the ground up by **Saqib Ahmad Bhat** (Department of Computer Science and Engineering, **Government College of Engineering, Tirunelveli**).

---

## 1. Executive Summary

**Emertech Certify v2.0** is an independent, ground-up software implementation engineered to eliminate academic credential fraud and provide instantaneous, tamper-evident degree verification. Developed under a strict clean-room software engineering protocol, every module, smart contract, API endpoint, vector PDF generator, OCR service, and React component was authored independently without copying code from upstream repositories.

### Dual-Layer Verification Paradigm
1. **Off-Chain Privacy Layer**: Student Personally Identifiable Information (PII) is structured into a canonical record, hashed deterministically via SHA-256 (NIST FIPS 180-4), compiled into a high-resolution vector PDF using `pdf-lib` with an embedded cryptographic QR code, and archived in content-addressed storage. Zero sensitive personal data (names, marks, GPAs, birthdates) is stored on-chain, minimizing PII exposure and facilitating alignment with GDPR Article 5(1)(c) and India DPDP Act data minimization principles.
2. **On-Chain Consensus Layer**: The 256-bit cryptographic digest (`bytes32 certHash`), issuer address, timestamp, revocation flag, and pseudonymized student hash are anchored immutably to an Ethereum smart contract (`EmertechCertificateRegistry.sol`). Any verifier can authenticate credentials, detect bit-level document alterations, or inspect on-chain revocation states (observed local benchmark: < 500ms; public blockchain verification latency depends on RPC provider response times and network congestion).

---

## 2. Core Architecture & Hybrid Design

Emertech Certify employs a **hybrid architecture** combining decentralized public verification with institutional issuance governance and offline test fallbacks:

```
[ Frontend: React 19 SPA ]  ◄──►  [ Backend REST API v2 ]  ◄──►  [ Ethereum Smart Contract ]
  • File Upload (SHA-256)           • CryptoService (Canonical)       • EmertechCertificateRegistry.sol
  • Hash Direct Query               • PdfVectorService (pdf-lib)      • mapping(bytes32 => Record)
  • QR Code Scanner                 • OcrService (Tesseract.js)       • On-Chain Revocation
  • Scanned Image OCR               • Embedded DB / FS Fallback       • Custom Gas-Efficient Errors
```

### On-Chain Data Model (`CertificateRecord`)
The Ethereum smart contract stores strictly minimal verification metadata:
- `bytes32 certHash`: 32-byte cryptographic SHA-256 digest of the canonical document payload.
- `address issuer`: Ethereum wallet address of the accredited issuing university.
- `uint64 issuedAt`: Block timestamp of credential issuance.
- `uint64 revokedAt`: Block timestamp of revocation (0 if currently active).
- `bool isRevoked`: Boolean flag reflecting revocation status.
- `string recipientIdHash`: Pseudonymized SHA-256 hash of the student registration number.
- `string metadataURI`: Content-addressed IPFS URI (`ipfs://...`) or local content reference.

> **Zero PII Confirmation**: Student legal names, letter grades, GPAs, and demographic records are strictly excluded from the blockchain ledger.

### Architectural Resiliency & Development Fallbacks
To enable seamless evaluation in offline or air-gapped environments:
- **In-Memory MongoDB**: Automatically started via `mongodb-memory-server` if an external MongoDB instance is unreachable.
- **Local Filesystem Storage**: Automatically persists generated vector PDFs and QR assets to disk (`storage/certificates/`) when third-party IPFS pinning (Pinata) is unconfigured.
- **Local Fallback Provider**: Retains an in-memory verification ledger when an external Ethereum JSON-RPC node is not connected, ensuring uninterrupted demonstration workflows.

### Multi-Modal Verification Engine
1. **Mode 1 (Blockchain Hash Query)**: Look up the 64-character hexadecimal SHA-256 digest on-chain.
2. **Mode 2 (PDF Binary Upload)**: Upload the certificate PDF. The system computes its SHA-256 hash in real time; if even a single character was altered, an immediate `TAMPER_DETECTED` warning is displayed.
3. **Mode 3 (QR Code Scanning)**: Decode the embedded QR verification payload.
4. **Mode 4 (AI Neural OCR)**: Extract text and metadata from physical paper scans via Tesseract.js WebAssembly.

---

## 3. Quickstart & Verification in 30 Seconds

```bash
# 1. Enter cleanroom directory
cd cleanroom

# 2. Run the complete test suite (14 contract tests + 18 backend tests)
npm run test:all
```

### Verified Terminal Output:
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

  14 passing (728ms)

================================================================
🧪 RUNNING EMERTECH CERTIFY CLEAN-ROOM TEST SUITE (v2.0)
================================================================
1. Testing System Health Check (/api/v2/health)...        ✅ Verified
2. Testing Super Admin Registration & Login...           ✅ Verified
3. Testing Academic Institution Application Queue...     ✅ Verified
4. Testing Admin Approval & Status Update...             ✅ Verified
5. Testing Authorized Institution Login...               ✅ Verified
6. Testing Student Account Registration & Login...       ✅ Verified
7. Testing Certificate Issuance & Vector PDF...          ✅ Verified
8. Testing Vector PDF Download Endpoint...               ✅ Verified
9. Testing Mode 1: Public Verification by Hash...        ✅ Verified
10. Testing Mode 2: Verification by PDF Upload...        ✅ Verified
11. Testing Tamper Detection on Altered PDF...           ✅ Verified
12. Testing Mode 3: QR Code Payload Verification...      ✅ Verified
13. Testing Student Credential Retrieval...              ✅ Verified
14. Testing On-Chain Certificate Revocation...           ✅ Verified
15. Testing Verification of Revoked Credential...        ✅ Verified
16. Testing Mode 4: Tesseract.js Neural OCR Image...     ✅ Verified
17. Testing Batch Certificate Issuance...                ✅ Verified
18. Testing Super Admin Telemetry...                     ✅ Verified

🎉 ALL 18 CLEAN-ROOM TESTS PASSED WITH 100% SUCCESS!
```

---

## 4. Documentation Index

- **[System Architecture](docs/ARCHITECTURE.md)**: Four-tier decoupled cryptographic architecture.
- **[Setup & Run Guide](docs/SETUP.md)**: Local deployment, environment variables, and ports.
- **[REST API v2 Specification](docs/API_DOCUMENTATION.md)**: Endpoints, payloads, and response formats.
- **[Smart Contracts](docs/SMART_CONTRACTS.md)**: Solidity ^0.8.20 specifications and gas optimizations.
- **[Security Policy](docs/SECURITY.md)**: Threat modeling, access control, and GDPR/DPDP privacy analysis.
- **[Testing Evidence](docs/TESTING.md)**: Test scenarios and execution instructions.
- **[Provenance & License Audit](docs/PROVENANCE_AUDIT.md)**: File-by-file clean-room independence audit.
- **[Changelog](docs/CHANGELOG.md)**: Semantic versioning history.
- **[Citation](docs/CITATION.cff)**: Standard academic software citation format.
- **[References](docs/REFERENCES.md)**: Technical standards, literature, and industry context.

---

## 5. Developer & Academic Identity

- **Lead Architect & Developer**: **Saqib Ahmad Bhat**
- **Academic Degree Program**: Bachelor of Engineering (B.E.), Computer Science and Engineering
- **Institution**: **Government College of Engineering, Tirunelveli**
- **Internship Demonstration Context**: AI and Blockchain Engineer Intern at **Emertech Innovations Private Limited**
- **License**: MIT License
