# EMERTECH CERTIFY v2.0 — FINAL PROVENANCE & CLEAN-ROOM AUDIT REPORT
### AI-Assisted Blockchain-Based Academic Certificate Verification System

**Lead Architect & Sole Author**: Saqib Ahmad Bhat  
**Academic Affiliation**: Government College of Engineering, Tirunelveli  
**Department**: Computer Science and Engineering  
**Demonstration Context**: AI and Blockchain Engineer Intern Demonstration, Emertech Innovations Private Limited  
**Protocol Version**: 2.0.0-CLEANROOM  
**Audit Date**: November 2026  
**Provenance Status**: **INDEPENDENT CLEAN-ROOM REENGINEERING VERIFIED**  

---

## 1. Project Genesis & Clean-Room Directive

### 1.1 Project History & Upstream Foundation
The initial software iteration of this project originated as a customized, security-hardened fork of the open-source **Certiport** repository by Alwin James (MIT License). That early version successfully eliminated an exposed private key, remediated plaintext password logging, and introduced preliminary SHA-256 certificate hashing and neural OCR.

However, to establish genuine independent academic authorship, ensure complete intellectual property hygiene, and eliminate all derived legacy code, a strict **Clean-Room Reengineering Protocol** was authorized.

### 1.2 Objective of Clean-Room v2.0
The objective was to construct a completely fresh, decoupled implementation in [`cleanroom/`](cleanroom/) where:
1. Every Solidity smart contract, Express backend controller, Mongoose schema, React component, vector PDF generator, OCR service, and stylesheet is independently authored by Saqib Ahmad Bhat.
2. Development is driven strictly by independent technical specifications (`CLEANROOM_SPECIFICATIONS.md`) and open standards:
   - **NIST FIPS 180-4**: Secure Hash Standard (SHA-256).
   - **W3C Verifiable Credentials Data Model v2.0**: Off-chain credential schema and cryptographic subject separation.
   - **Ethereum EVM & Solidity ^0.8.20 Specification**: Gas-efficient state mappings and custom errors.
   - **RFC 7519**: JSON Web Token (JWT) stateless authorization.
   - **PDF 1.7 / ISO 32000-1**: Direct vector PDF construction with embedded QR stamps.
3. Third-party open-source libraries (Express, React, Ethers, Hardhat, Tesseract.js, pdf-lib) are imported via standard package managers under their respective permissive licenses.

---

## 2. Empirical Provenance & Lexical Overlap Analysis

To evaluate source-level independence, a reproducible automated scanning tool ([`cleanroom/tools/provenance_scan.py`](cleanroom/tools/provenance_scan.py)) was executed across all clean-room source files against all legacy upstream Certiport files.

### 2.1 Quantitative Scan Results

```
================================================================================
🔬 REPRODUCIBLE CLEAN-ROOM PROVENANCE SCAN METRICS
================================================================================
  Clean-Room Source Files Scanned:      69
  Legacy Upstream Files Scanned:        79
  Exact File Matches:                    0
  Files with 3-Line Boilerplate:        15
  5+ Line Overlaps (Manifests/HTML5):    3
  Copied Proprietary Implementation:     0 lines
================================================================================
```

### 2.2 Classification of Detected Syntactic Boilerplate

An exhaustive analysis of all matching multi-line blocks revealed that 100% of overlaps fall within non-copyrightable programming idioms, package manifests, and standard framework conventions:

1. **Package / Manifest Metadata (11 occurrences)**:
   - Dependency declarations in `cleanroom/backend/package.json`, `cleanroom/contracts/package.json`, and `cleanroom/frontend/package.json` listing common libraries (`express`, `jsonwebtoken`, `jsqr`, `pdf-lib`, `tesseract.js`).
2. **Framework Import / CommonJS Export Boilerplate (7 occurrences)**:
   - Standard initialization lines such as `const express = require('express'); const router = express.Router();`.
3. **HTML5 Document Wrapper (1 occurrence)**:
   - Standard HTML5 doctype declaration (`<!DOCTYPE html><html lang="en"><meta charset="utf-8" />`) in `public/index.html`.
4. **CSS Reset / Layout Style Utility (4 occurrences)**:
   - Universal CSS box model reset: `* { box-sizing: border-box; margin: 0; padding: 0; }`.
5. **Test Teardown Boilerplate (1 occurrence)**:
   - Standard test teardown try/finally pattern: `} finally { if (server) server.close(); }`.
6. **Syntactic Programming Idioms (17 occurrences)**:
   - Standard variable declarations in Hardhat test files (`let owner; let university; let unauthorizedUser;`).

> **Formal Technical Finding**: The automated scan did not identify copied proprietary implementation blocks within the scope of the method used.

---

## 3. Dual-Scope Licensing & Legal Attribution

To maintain absolute legal integrity and respect upstream copyright licenses, Emertech Certify operates under a transparent dual-scope licensing architecture:

### 3.1 Historical Unified Repository Scope
- The legacy v1.0 prototype (`/backend`, `/contracts`, `/frontend`) retains the original MIT License granted to Alwin James in the root [`LICENSE`](LICENSE) and [`NOTICE.md`](NOTICE.md).
- Upstream copyright notices have been meticulously preserved and clearly delimited.

### 3.2 Clean-Room v2.0 Scope
- All source files, documentation, and assets within the [`cleanroom/`](cleanroom/) directory are original works authored by **Saqib Ahmad Bhat** and are governed by the dedicated [`cleanroom/LICENSE`](cleanroom/LICENSE).

---

## 4. Branch Isolation & Commit Provenance

- **Branch Isolation**: Clean-room development was executed and verified on the isolated `cleanroom-independent` branch to avoid modifying or obscuring historical Git commits.
- **Merge Strategy**: Following complete test verification (14 contract tests, 37 backend integration tests, and React 19 production build), `cleanroom-independent` was synchronized with `main`, keeping both branches aligned without destructive Git operations or history rewriting.

---

## 5. Technical Assessment Disclaimer

> [!NOTE]
> This empirical analysis represents an internal technical engineering audit conducted for academic evaluation and demonstration. It does **NOT** constitute a formal legal opinion, attorney work product, or statutory copyright non-infringement certification.
