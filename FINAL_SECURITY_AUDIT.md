# EMERTECH CERTIFY v2.0 — FINAL SECURITY AUDIT REPORT
### AI-Assisted Blockchain-Based Academic Certificate Verification System

**Lead Architect & Security Lead**: Saqib Ahmad Bhat  
**Academic Affiliation**: Government College of Engineering, Tirunelveli  
**Department**: Computer Science and Engineering  
**Demonstration Context**: AI and Blockchain Engineer Intern Demonstration, Emertech Innovations Private Limited  
**Audit Scope**: Entire Clean-Room v2.0 Codebase (`cleanroom/`) and Git Tracking Configuration  
**Audit Date**: November 2026  
**Security Status**: **PASSED — ALL REMEDIATIONS VERIFIED**  

---

## 1. Executive Summary

This comprehensive security audit evaluated **Emertech Certify v2.0** across its smart contracts, backend microservice, key custody subsystem, authentication layers, file handling pipelines, and frontend interfaces.

The primary objectives of this audit were:
1. Verify that no hardcoded credentials, private keys, API secrets, or default fallback secrets exist in tracked Git files.
2. Confirm the complete remediation of privilege escalation vulnerabilities in public registration.
3. Validate the security of out-of-band administrative bootstrap and protected institutional provisioning.
4. Assess the cryptographic strength of institutional key custody and data isolation.
5. Verify application-layer defenses including HTTP security headers and magic byte validation.
6. Analyze data minimization and privacy compliance with respect to GDPR Article 5(1)(c) and India DPDP Act.

---

## 2. Critical Credential Exposure Audit

A comprehensive regular expression and entropy scan was conducted across all files, configuration manifests, test fixtures, and documentation in the repository.

### Audit Findings:
- **Ethereum Private Keys**: Zero plaintext Ethereum private keys exist in any tracked files. The historical upstream private key was permanently removed.
- **Production Key Deny-List (`config/env.js`)**: Known Hardhat development account private keys are indexed by SHA-256 hash in a static set (`KNOWN_DEV_KEY_SHA256`). If a known development private key is configured on a non-local network, the application terminates immediately with a security violation.
- **JWT Secret Security**: `JWT_SECRET` must be explicitly provided in production environments. In test mode, an ephemeral cryptographic 32-byte secret is generated dynamically in memory.
- **Key Vault Secret Security**: `KEY_VAULT_SECRET` is strictly decoupled from `JWT_SECRET`. If `KEY_VAULT_SECRET` is absent in production, the application fails fast on startup.
- **Git Ignore Hygiene**: The root `.gitignore` explicitly excludes `.env`, `.env.*`, `*.env`, private keys, local build caches, and runtime storage artifacts, while ensuring `.env.example` templates remain tracked.

---

## 3. Authentication & Privilege Escalation Hardening

### 3.1 Public Registration Vulnerability & Remediation
- **Attack Vector**: In the initial code, `AuthController.register` accepted `{ role }` directly from the client body (`role: role || 'STUDENT'`), allowing any unauthenticated attacker to promote themselves to `SUPER_ADMIN` or `INSTITUTION_ADMIN`.
- **Enforced Remediation**:
  ```javascript
  if (role && (role.toUpperCase() === 'SUPER_ADMIN' || role.toUpperCase() === 'INSTITUTION_ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Privilege escalation rejected: Public registration is restricted to STUDENT accounts only.'
    });
  }
  ```
  The endpoint strictly forces `role: 'STUDENT'`, binds empty defaults for `institutionCode` and `walletAddress`, and validates email format and password strength (min 8 characters).

### 3.2 One-Time Super Administrator Bootstrap
- **Mechanism**: The initial Super Administrator cannot be created through the public API. It is provisioned exclusively via a local CLI script:
  ```bash
  npm run bootstrap:admin
  ```
- **Security Invariant**: The script verifies that `User.countDocuments({ role: 'SUPER_ADMIN' }) === 0`. If an administrator already exists, execution terminates immediately, preventing duplicate bootstrap or takeover attempts.

### 3.3 Protected Institution Administrator Provisioning
- **Access Control**: Callable exclusively by an authenticated Super Administrator via `POST /api/v2/admin/institutions/:id/provision-admin`.
- **Preconditions**: Target institution must exist, have `status: 'AUTHORIZED'`, and have confirmed on-chain accreditation (`onChainAuthorized: true`).
- **Data Binding**: Newly created administrator is immutably linked to the target institution's verified `institutionCode` and `walletAddress`.
- **Safe Response**: Returns user metadata; never logs or transmits password hashes or private keys.

---

## 4. Institutional Key Custody (`KeyVaultService`)

### 4.1 Cryptographic Architecture
- **Secret Separation**: The vault master secret `KEY_VAULT_SECRET` is completely separate from `JWT_SECRET`.
- **Key Derivation Function (KDF)**: Master keys are derived via PBKDF2 with 100,000 iterations of HMAC-SHA256 and a dedicated salt (`emertech-keyvault-kdf-salt-v2`).
- **Authenticated Encryption**: Keys are encrypted at rest using AES-256-GCM with unique 96-bit initialization vectors (IVs) and 128-bit authentication tags.
- **Persistent Custody in Database**: Encrypted credentials (`encryptedPrivateKey`, `keyVaultIv`, `keyVaultTag`) are stored on the MongoDB `Institution` document, surviving server restarts.
- **Memory Lifecycle**: Plaintext private keys are decrypted into ephemeral `ethers.Wallet` instances in memory solely during transaction signing and are never written to logs or exposed via API.

---

## 5. Multi-Tenant Institutional Isolation (RBAC)

| Endpoint | Permitted Role | Isolation Mechanism |
| :--- | :--- | :--- |
| `POST /institutions/issue` | `INSTITUTION_ADMIN`, `SUPER_ADMIN` | Scoped strictly to `req.user.institutionCode`. Mismatched codes rejected. |
| `POST /institutions/batch` | `INSTITUTION_ADMIN`, `SUPER_ADMIN` | Scoped strictly to `req.user.institutionCode`. |
| `POST /institutions/revoke` | `INSTITUTION_ADMIN`, `SUPER_ADMIN` | Verifies `certificate.institutionCode === req.user.institutionCode`. Cross-tenant revocation blocked with **HTTP 403 Forbidden**. |
| `GET /institutions/certificates` | `INSTITUTION_ADMIN`, `SUPER_ADMIN` | Filters query strictly by `req.user.institutionCode`. |
| `GET /certificates/student/my-certificates` | `STUDENT`, `SUPER_ADMIN` | Queries exclusively by `req.user.studentIdentifier`. |

---

## 6. Application Layer Security & Input Validation

### 6.1 Security Response Headers
Global Express middleware injects standard security headers:
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `X-Frame-Options: DENY`: Prevents clickjacking attacks.
- `X-XSS-Protection: 1; mode=block`: Activates browser XSS filtering.
- `Strict-Transport-Security`: Enforces HTTPS in production environments.

### 6.2 Magic Byte Header Validation
File upload routes perform deep binary signature inspection:
- `POST /verify/file`: Checks `%PDF-` (`0x25 0x50 0x44 0x46`) header signature.
- `POST /verify/ocr`: Checks PNG (`0x89 0x50 0x4E 0x47`) or JPEG (`0xFF 0xD8 0xFF`) header signatures.
- Files with invalid or deceptive extensions are rejected with **HTTP 400 Bad Request**.

---

## 7. Smart Contract Security (`EmertechCertificateRegistry.sol`)

- **EVM Custom Errors**: Utilizes custom errors (`OnlyContractOwnerAllowed`, `OnlyAuthorizedInstitutionAllowed`, `CertificateAlreadyRegistered`, `UnauthorizedRevocation`, `CertificateDoesNotExist`) instead of revert strings, saving significant gas and preventing revert-string length exploits.
- **Zero On-Chain PII**: The contract stores only `bytes32 certHash`, `address issuer`, `uint64 issuedAt`, `uint64 revokedAt`, `bool isRevoked`, and a salted pseudonymized `recipientIdHash`. No student names, marks, grades, or personal details are ever written to the public blockchain.
- **Idempotent Issuance**: Reverts if `certificates[certHash].issuedAt != 0`, preventing replay attacks or duplicate records.
- **Access Control Modifiers**: `onlyOwner` governs institutional accreditation; `onlyAuthorized` governs certificate registration; revocation is restricted to `msg.sender == cert.issuer || msg.sender == owner`.

---

## 8. Threat Matrix & Defense Verification

| Threat Vector | Severity | Attack Mechanism | Verified Defense | Test Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Privilege Escalation** | Critical | Client passes `role: "SUPER_ADMIN"` in public registration | Controller rejects with HTTP 403 Forbidden; forces STUDENT | Test 5 & 6 (Passed) |
| **Cross-Tenant Attack** | High | Admin from Univ B revokes Univ A certificate | Controller checks institutionCode match; rejects with 403 | Test 27 (Passed) |
| **Document Forgery** | Critical | Attacker alters text or grade in PDF | SHA-256 avalanche effect triggers TAMPER_DETECTED | Test 24 (Passed) |
| **Fake Degree Minting**| High | Rogue wallet attempts to call contract directly | Contract reverts with `OnlyAuthorizedInstitutionAllowed` | Contract Test 8 (Passed) |
| **Key Exposure** | Critical | Private keys hardcoded in code or committed to Git | Zero keys tracked; PBKDF2/AES-256-GCM vault custody | Test 19 (Passed) |
| **MIME Spoofing** | Medium | Attacker uploads malicious script disguised as PDF | Deep magic byte header inspection rejects invalid files | Test 32 (Passed) |
| **Unauthorized Admin** | High | Student attempts to provision an institution admin | Route requires `SUPER_ADMIN`; rejected with HTTP 403 | Test 16 (Passed) |

---

## 9. Academic Prototype Disclaimer

> [!NOTE]
> Emertech Certify v2.0 is an academic software demonstration and research prototype engineered by Saqib Ahmad Bhat for educational and demonstration purposes. While engineered with industry-standard cryptographic practices (NIST FIPS 180-4, AES-256-GCM, PBKDF2, and Solidity ^0.8.20), production deployment in a commercial enterprise requires integration with dedicated hardware security modules (HSMs / AWS KMS), formally audited multi-signature smart contracts, and professional penetration testing.
