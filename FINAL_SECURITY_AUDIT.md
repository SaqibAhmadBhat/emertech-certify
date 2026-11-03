# EMERTECH CERTIFY v2.0 — FINAL SECURITY AUDIT REPORT
### AI-Assisted Blockchain-Based Academic Certificate Verification System

**Lead Architect & Security Lead**: Saqib Ahmad Bhat  
**Academic Affiliation**: Government College of Engineering, Tirunelveli  
**Department**: Computer Science and Engineering  
**Demonstration Context**: AI and Blockchain Engineer Intern Demonstration, Emertech Innovations Private Limited  
**Audit Scope**: Entire Clean-Room v2.0 Codebase (`cleanroom/`) and Git Tracking Configuration  
**Audit Date**: November 2026  
**Security Status**: **PASSED — ALL REMEDIATIONS IMPLEMENTED & VERIFIED**  

---

## 1. Executive Summary

This comprehensive security audit evaluated **Emertech Certify v2.0** across its smart contracts, backend microservice, key custody subsystem, authentication layers, file handling pipelines, and frontend interfaces.

The primary objectives of this audit were:
1. Verify that no hardcoded credentials, private keys, API secrets, or default fallback secrets exist in tracked Git files.
2. Confirm the complete removal of hardcoded key vault secrets and implementation of per-record random salt, PBKDF2 key derivation (100,000 rounds), and AES-256-GCM encryption with AAD bound to the institution's wallet address.
3. Validate the security of the out-of-band administrative bootstrap: zero default credentials, CLI argument rejection to prevent process snooping, strict password policy (min 12 chars), and atomic database concurrency protection.
4. Verify student least-privilege identity association: public registration restricted to unassociated student accounts only, rejection of self-asserted student ID or institution code, and cryptographic token verification for enrollment claims.
5. Validate state preservation invariants: failure of an on-chain suspension or revocation preserves the database status, returns HTTP 502 Bad Gateway, and records the failure in the audit log.
6. Verify real persistent institutional key custody against a live EVM node with an independent, non-RPC unlocked wallet funded with ETH.
7. Assess data minimization and privacy compliance with respect to GDPR Article 5(1)(c) and India DPDP Act.

---

## 2. Critical Credential Exposure Audit

A comprehensive regular expression and entropy scan was conducted across all files, configuration manifests, test fixtures, and documentation in the repository.

### Audit Findings:
- **Ethereum Private Keys**: Zero plaintext Ethereum private keys exist in any tracked files. The historical upstream private key was permanently removed.
- **Production Key Deny-List (`config/env.js`)**: Known Hardhat development account private keys are indexed by SHA-256 hash in a static set (`KNOWN_DEV_KEY_SHA256`). If a known development private key is configured on a non-local network, the application terminates immediately with a security violation.
- **JWT Secret Security**: `JWT_SECRET` must be explicitly provided in production environments (min 32 characters). In test mode, an ephemeral cryptographic 32-byte secret is generated dynamically in memory.
- **Key Vault Secret Security**: `KEY_VAULT_SECRET` is strictly decoupled from `JWT_SECRET`. No hardcoded fallback secret exists. If `KEY_VAULT_SECRET` is absent outside test mode or shorter than 32 characters, the application fails fast on startup.
- **Git Ignore Hygiene**: The root `.gitignore` explicitly excludes `.env`, `.env.*`, `*.env`, private keys, local build caches, and runtime storage artifacts, while ensuring `.env.example` templates remain tracked.

---

## 3. Key Vault Cryptographic Hardening (`KeyVaultService`)

### 3.1 Cryptographic Architecture
- **Master Secret Invariant**: Zero hardcoded master secrets. `KEY_VAULT_SECRET` is required and enforced with a minimum length of 32 characters.
- **Per-Record Random Salt**: Every encrypted institution private key utilizes a uniquely generated 32-byte (256-bit) cryptographically secure derivation salt (`crypto.randomBytes(32)`).
- **Key Derivation Function (KDF)**: Master keys are derived via PBKDF2 with 100,000 iterations of HMAC-SHA256 and the per-record salt, mitigating rainbow table and pre-computation attacks.
- **Authenticated Encryption**: Keys are encrypted at rest using AES-256-GCM with unique 96-bit initialization vectors (IVs) and 128-bit authentication tags.
- **Additional Authenticated Data (AAD)**: The institution's registered wallet address is bound as AAD (`Buffer.from(walletAddress.toLowerCase(), 'utf8')`). Any attempt to transplant an encrypted key to a different wallet causes decryption failure.
- **Key Derivation Validation**: Before storing or using an encrypted key, the system validates that the private key derives the exact registered institution wallet address.
- **Key Versioning**: Persistent records include `keyVersion: 1` to support zero-downtime key rotation.

---

## 4. Super Administrator Genesis Bootstrap Hardening

- **Zero Default Credentials**: All hardcoded default credentials (`admin@emertech.org`, `SuperAdmin2026!Secure`) have been eradicated.
- **Process Inspection Protection**: `process.argv` passwords are explicitly prohibited. Supplying passwords via command-line arguments terminates execution with exit code 1 to prevent credentials from being exposed in `ps` or process listings.
- **Strict Password Policy**:
  - Minimum 12 characters length.
  - At least one uppercase letter (A-Z).
  - At least one lowercase letter (a-z).
  - At least one digit (0-9).
  - At least one special character (`!@#$%^&*()_+-=[]{};':"|,.<>/?`).
- **Atomic Database Guard**: An atomic partial unique index on `{ role: 1 }` with `partialFilterExpression: { role: 'SUPER_ADMIN' }` guarantees at the database engine level that no more than one Super Administrator can ever be created, even under concurrent race conditions.
- **Failure Exit Code**: The bootstrap CLI terminates with exit code 1 on any configuration, policy, or database error.

---

## 5. Student Least Privilege & Verified Enrollment Association

### 5.1 Public Registration Hardening
- Public registration (`POST /api/v2/auth/register`) is strictly restricted to least-privilege `STUDENT` accounts.
- Any request containing administrative roles (`SUPER_ADMIN` or `INSTITUTION_ADMIN`) is rejected with **HTTP 403 Forbidden**.
- **Self-Assertion Barrier**: Any request containing `studentIdentifier` or `institutionCode` during public registration is rejected with **HTTP 400 Bad Request**. Public registration creates an unassociated student account with `studentIdentifier: null` and `institutionCode: null`.

### 5.2 Cryptographic Enrollment & Identity Claiming
- **Institutional Token Generation**: An authenticated Institution Admin generates an enrollment token (`POST /api/v2/institutions/enrollments`) with student name, email, and roll number. A high-entropy token (`ENR-` + 32 hex chars) is generated.
- **Identity Claiming**: A registered student calls `POST /api/v2/auth/claim-identity` providing their `enrollmentToken` and `studentIdentifier`.
- **Atomic Binding**: The system verifies that the enrollment exists, matches the student ID, and is unclaimed (`isClaimed: false`). The student's account is atomically bound to the verified `studentIdentifier` and `institutionCode`, and a refreshed JWT is issued.
- **Transcript Route Guard**: `GET /api/v2/certificates/student/my-certificates` requires verified identity. Unverified student accounts receive **HTTP 403 Forbidden**.

---

## 6. Blockchain State Preservation & Failure Invariants

- **Suspension Failure Invariant**: If an on-chain institution suspension transaction reverts or the blockchain RPC is unreachable, the system does **not** update MongoDB state to `SUSPENDED`. The database status remains `AUTHORIZED`, an `INSTITUTION_SUSPENSION_FAILED` event is recorded in the AuditLog, and **HTTP 502 Bad Gateway** is returned.
- **Revocation Failure Invariant**: If an on-chain certificate revocation transaction reverts or the network is unreachable, MongoDB `isRevoked` is **not** set to `true`. The database certificate remains active (`isRevoked: false`), a `REVOCATION_FAILED` event is recorded in the AuditLog, and **HTTP 502 Bad Gateway** is returned.

---

## 7. Real Persistent Institutional Key Custody & Live EVM Verification

A dedicated end-to-end integration test (Test 20B) verifies real institutional signing:
1. An independent random wallet is generated (`ethers.Wallet.createRandom()`).
2. The test asserts that this address is **not** an unlocked account on the local Hardhat node.
3. The deployer funds the address with 1.0 test ETH.
4. The institution is accredited on-chain, and the encrypted private key is stored via `POST /api/v2/admin/institutions/:id/key-custody`.
5. The in-memory cache is wiped (`KeyVaultService.resetVault()`).
6. The institution issues a certificate: the backend loads the ciphertext from MongoDB, decrypts it using PBKDF2/AES-256-GCM, constructs an `ethers.Wallet`, and submits a live transaction to the EVM.
7. The mined transaction receipt is verified on the smart contract (`verifyCertificate`), confirming that the on-chain issuer address strictly matches the decrypted persistent wallet address.

---

## 8. Threat Matrix & Defense Verification

| Threat Vector | Severity | Attack Mechanism | Verified Defense | Test Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Privilege Escalation** | Critical | Client passes `role: "SUPER_ADMIN"` in public registration | Controller rejects with HTTP 403 Forbidden; forces STUDENT | Test 5 & 6 (Passed) |
| **Identity Spoofing** | High | Student registers with arbitrary student ID or institution code | Public registration rejects with HTTP 400; requires token claim | Test 7 & 18B (Passed) |
| **Cross-Tenant Attack** | High | Admin from Univ B revokes Univ A certificate | Controller checks institutionCode match; rejects with 403 | Test 27 (Passed) |
| **State Desynchronization**| High | On-chain tx fails during suspension or revocation | DB state preserved; returns HTTP 502; AuditLog records failure | Test 12 & 28 (Passed) |
| **Document Forgery** | Critical | Attacker alters text or grade in PDF | SHA-256 avalanche effect triggers TAMPER_DETECTED | Test 24 (Passed) |
| **Fake Degree Minting**| High | Rogue wallet attempts to call contract directly | Contract reverts with `OnlyAuthorizedInstitutionAllowed` | Contract Test 8 (Passed) |
| **Key Exposure** | Critical | Private keys hardcoded in code or committed to Git | Zero keys tracked; PBKDF2/AES-256-GCM vault custody | Tests 2B, 19, 20B (Passed) |
| **MIME Spoofing** | Medium | Attacker uploads malicious script disguised as PDF | Deep magic byte header inspection rejects invalid files | Test 32 (Passed) |
| **Unauthorized Admin** | High | Student attempts to provision an institution admin | Route requires `SUPER_ADMIN`; rejected with HTTP 403 | Test 16 (Passed) |

---

## 9. Academic Prototype Characterization

> [!NOTE]
> Emertech Certify v2.0 is an academic software demonstration and research prototype engineered by Saqib Ahmad Bhat for educational and demonstration purposes. While engineered with industry-standard cryptographic practices (NIST FIPS 180-4, AES-256-GCM, PBKDF2, and Solidity ^0.8.20), production deployment in a commercial enterprise requires integration with dedicated hardware security modules (HSMs / AWS KMS), formally audited multi-signature smart contracts, and professional penetration testing.
