# Emertech Certify — Clean-Room Engineering Audit & Provenance Protocol

**Project Title**: Emertech Certify: AI-Assisted Blockchain-Based Academic Certificate Verification System  
**Lead Architect & Sole Maintainer**: Saqib Ahmad Bhat  
**Academic Affiliation**: Government College of Engineering, Tirunelveli (Department of Computer Science and Engineering)  
**Corporate Academic Context**: Emertech Innovations Private Limited (AI & Blockchain Engineer Intern Demonstration)  
**Audit Date**: November 2026  
**Protocol Version**: 2.0.0-CLEANROOM  

---

## 1. Executive Summary & Purpose

This document establishes the formal **Clean-Room Software Engineering Protocol** for **Emertech Certify**. 

The initial release of this project originated as a customized, security-hardened fork of the open-source **Certiport** repository by Alwin James (MIT License). While that version rectified critical security flaws (such as exposed private keys and plaintext credential logging) and added essential features (SHA-256 on-chain hashing, revocation, and AI OCR), the objective of this clean-room re-engineering initiative is to:

1. **Eliminate All Inherited Upstream Code**: Completely decouple the project from legacy Certiport implementation files, architectural patterns, UI components, and backend controllers.
2. **Produce a Genuinely Original Software Implementation**: Construct a ground-up codebase where every Solidity smart contract, Express backend controller, Mongoose schema, React component, vector PDF generator, OCR service, and stylesheet is independently authored by Saqib Ahmad Bhat.
3. **Strict Compliance with Legal & Provenance Standards**: Ensure no copyright notices are improperly removed while any derived material exists. Once complete independent provenance is verified across all files in the clean-room directory, document the third-party dependency licenses and establish clean authorship for all newly authored source code.

---

## 2. Legacy Repository Audit & Inherited File Inventory

An exhaustive audit of the initial repository identified the following inherited components and their respective origins:

### 2.1 Inherited Backend Files (`backend/`)
- `backend/controllers/authController.js`: Legacy authentication logic with plaintext environment credential logging (remediated in v1.0, to be replaced completely).
- `backend/controllers/adminController.js`: Upstream university onboarding and approval routing.
- `backend/controllers/universityController.js`: Upstream certificate issuance pipeline.
- `backend/controllers/studentController.js`: Upstream student record retrieval.
- `backend/controllers/templateController.js`: Legacy template file handler (insecure upload route removed in v1.0).
- `backend/models/User.js`: Upstream user schema.
- `backend/models/Certificate.js`: Upstream certificate schema.
- `backend/models/PendingRequest.js`: Upstream institution approval schema.
- `backend/models/Template.js`: Upstream template schema.
- `backend/templates/un02/`, `backend/templates/un03/`: Legacy EJS HTML certificate templates.
- `backend/utils/pdfGenerator.js`: Puppeteer HTML-to-PDF rendering pipeline.
- `backend/utils/pinata.js`: Direct Pinata API wrapper.
- `backend/utils/templateParser.js`: EJS string interpolation parser.
- `Certiport-documentation.pdf`: Upstream binary PDF manual.

### 2.2 Inherited Smart Contract Files (`contracts/`)
- `contracts/contracts/CertificateRegistry.sol`: Upstream contract tracking certificates by string `certificateId` (heavily modified in v1.0 with `bytes32` hash and revocation, but retaining upstream base structure).
- `contracts/getAddress.js`: Upstream script previously containing an exposed plaintext Ethereum private key.
- `contracts/getBalance.js`: Upstream testnet balance checker.
- `contracts/scripts/deploy.js`: Upstream Hardhat deployment script.

### 2.3 Inherited Frontend Files (`frontend/certiport-frontend/`)
- `frontend/certiport-frontend/src/pages/AdminDashboard.js`: Upstream admin panel layout.
- `frontend/certiport-frontend/src/pages/UniversityDashboard.js`: Upstream university portal layout.
- `frontend/certiport-frontend/src/pages/StudentDashboard.js`: Upstream student portal layout.
- `frontend/certiport-frontend/src/pages/VerifyCertificate.js`: Upstream single ID lookup screen.
- `frontend/certiport-frontend/src/pages/Login.js`, `Register.js`: Upstream auth forms.
- `frontend/certiport-frontend/src/styles/*.css`: Upstream legacy stylesheets.

---

## 3. Clean-Room Reengineering Guidelines

The clean-room implementation is governed by the following strict engineering rules:

1. **Zero Copy-Paste Rule**: No source code, JSX structure, CSS rules, or database models from the legacy repository will be copied into `cleanroom/`.
2. **Requirements-Driven Development**: All code is implemented strictly against independent functional specifications defined in `CLEANROOM_SPECIFICATIONS.md` and publicly available standards:
   - **NIST FIPS 180-4**: Secure Hash Standard (SHA-256).
   - **W3C Verifiable Credentials Data Model v2.0**: Off-chain credential schema and cryptographic subject separation.
   - **Ethereum EVM & Solidity ^0.8.20 Specification**: Gas-efficient state mappings, custom errors, and events.
   - **RFC 7519**: JSON Web Token (JWT) stateless authorization.
   - **PDF 1.7 / ISO 32000-1**: Vector PDF construction with embedded QR stamps.
3. **Original UI/UX Identity**:
   - Original vector SVG logo: Interlocking cryptographic hexagon and graduation cap.
   - Fresh design system: Glassmorphic dark/light surfaces, modern typography, electric blue `#38BDF8`, deep indigo `#4F46E5`, and emerald `#10B981`.
   - Distinct component hierarchy, custom CSS modules, and unique layouts.
4. **Third-Party Dependency Attribution**:
   - Established open-source dependencies (e.g., Express, React, Ethers, Hardhat, Tesseract.js, pdf-lib) are imported via standard package managers.
   - The license and notice for each open-source library will be tracked in `REFERENCES.md` and `PROVENANCE_AUDIT.md`.
5. **Independent Git Branch Isolation & Clean Consolidation**:
   - Clean-room development was executed and verified on the isolated `cleanroom-independent` branch to avoid modifying historical commits.
   - Upon comprehensive verification (14 contract tests, 18 backend tests, frontend production build), the branch was fast-forward merged to `main` (commit `4a2673409f0f4544bbb34039c834cc61970edf4a`), preserving both branches in sync without force-pushing or rewriting commit history.

---

## 4. Verification Checkpoints & Concrete Verification Evidence

The clean-room implementation has been evaluated against all five mandatory criteria and verified with empirical terminal evidence:

- [x] **Checkpoint 1: Specifications Complete** — Formal technical specifications authored independently in `CLEANROOM_SPECIFICATIONS.md` without referencing proprietary upstream Certiport code. Defined strictly against public open standards: NIST FIPS 180-4 (Secure Hash Standard SHA-256), W3C Verifiable Credentials Data Model v2.0, RFC 7519 (JWT), EVM Solidity ^0.8.20, and ISO 32000-1 (PDF).
- [x] **Checkpoint 2: Contracts Clean & Verified** — Smart contract `EmertechCertificateRegistry.sol` authored from scratch in Solidity `^0.8.20`. Employs custom errors for gas optimization (`OnlyContractOwnerAllowed`, `UnauthorizedRevocation`, etc.), gas-packed structs (`CertificateRecord`, `InstitutionRecord`), and index-mapped events.
  - *Evidence*: Hardhat test suite executed in `cleanroom/contracts`: **14/14 unit tests passing** (819ms) covering deployment, access control, certificate anchoring, duplication prevention, zero-hash rejection, multi-party revocation, and edge-case diagnostics.
- [x] **Checkpoint 3: Backend Clean & Verified** — Ground-up Node.js/Express REST microservice (`cleanroom/backend`) featuring completely new controllers, Mongoose schemas (`User`, `Institution`, `Certificate`, `AuditLog`), pure `pdf-lib` vector PDF generation with cryptographic QR stamps, Tesseract.js WebAssembly OCR pipeline, and automated fallbacks (in-memory MongoDB via `mongodb-memory-server`, local filesystem content storage).
  - *Evidence*: Integration test suite executed in `cleanroom/backend`: **18/18 API integration tests passing** covering authentication, institutional onboarding, vector PDF compilation, 4 verification modes (Hash, File binary, QR payload, Neural OCR), revocation lifecycle, and administrative telemetry.
- [x] **Checkpoint 4: Frontend Clean & Verified** — React 19 single-page application built with original UI components, unique vector SVG branding (`Logo.js`), midnight navy design system with CSS glassmorphism, and live interactive hash diagnostic tools.
  - *Evidence*: Production build executed via `CI=true npm run build`: **Compiled successfully** with zero errors or warnings, producing optimized bundles (`main.ec511902.js` 109.75 kB gzip, `main.67b0325b.css` 1.94 kB).
- [x] **Checkpoint 5: Provenance Audit Passed** — Comprehensive AST and token-level comparison conducted across 48 clean-room source files versus 73 legacy Certiport files.
  - *Evidence*: Zero lines of proprietary or algorithmic code were copied. Overlaps detected are strictly limited to universal syntactic boilerplate and open-source idiomatic patterns (e.g. `e.preventDefault()`, standard CSS box-sizing resets, standard Solidity `onlyOwner` modifiers, and Mongoose schema type declarations). Third-party library boundaries are preserved under their respective upstream licenses. Full empirical breakdown documented in `docs/PROVENANCE_AUDIT.md`.
