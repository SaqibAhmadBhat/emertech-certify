# Emertech Certify — Security Policy & Threat Model (Clean-Room v2.0)

**Architect**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  

---

## 1. Security Architecture & Invariants

Emertech Certify v2.0 was developed under a strict clean-room engineering process to prevent common web3, cryptographic, and web application vulnerabilities:

### 1. Zero Credential Exposure
- No private keys, mnemonics, API secrets, or passwords are hardcoded in source code or documentation.
- The repository `.gitignore` explicitly prevents `.env` and sensitive files from being tracked in Git.
- `KNOWN_DEV_KEY_SHA256` deny-list check in `config/env.js` prevents accidental use of default Hardhat test keys on public testnets or mainnets.

### 2. Privilege Escalation Prevention & RBAC
- **Public Registration Least Privilege**: Public registration (`POST /api/v2/auth/register`) strictly permits self-registration of `STUDENT` accounts only. Any client attempt to supply `role: 'SUPER_ADMIN'` or `role: 'INSTITUTION_ADMIN'` is immediately rejected with HTTP 403 Forbidden.
- **One-Time Super Admin Bootstrap**: The initial Super Administrator cannot be created via the public API. It is provisioned exclusively via a secure one-time CLI script (`npm run bootstrap:admin` / `scripts/bootstrap-super-admin.js`) which enforces an invariant check preventing multiple executions once an administrator exists.
- **Protected Institution Admin Provisioning**: Institution Administrator accounts can only be provisioned by an authenticated Super Administrator via `POST /api/v2/admin/institutions/:id/provision-admin` for institutions that have been verified, accredited, and confirmed on-chain (`status: 'AUTHORIZED'` and `onChainAuthorized: true`).
- **Multi-Tenant Institutional Isolation**: Institution Administrators are strictly confined to their own institution code. Cross-tenant certificate issuance and cross-tenant certificate revocations are strictly blocked at the controller layer with HTTP 403 Forbidden.

### 3. Institutional Key Custody (`KeyVaultService`)
- **Independent Secret Isolation**: `KEY_VAULT_SECRET` is strictly separated from `JWT_SECRET`. It is never derived from or shared with session signing keys.
- **Key Derivation (KDF)**: Master encryption keys are derived using PBKDF2 with 100,000 iterations of HMAC-SHA256 and high-entropy salt (`emertech-keyvault-kdf-salt-v2`).
- **Authenticated Encryption**: Keys are encrypted at rest using AES-256-GCM with unique 96-bit initialization vectors (IVs) and 128-bit authentication tags.
- **Persistent Database Custody**: Institutional signing credentials (`encryptedPrivateKey`, `keyVaultIv`, `keyVaultTag`) are persisted directly on the `Institution` MongoDB document, surviving server restarts while never exposing plaintext private keys in memory dumps, logs, or API responses.

### 4. Application Layer Defense
- **HTTP Security Headers**: Automated middleware injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Strict-Transport-Security`.
- **Magic Byte Validation**: File upload endpoints enforce deep binary header validation: `/verify/file` validates `%PDF-` (`0x25 0x50 0x44 0x46`), and `/verify/ocr` validates PNG (`0x89 0x50 0x4E 0x47`) or JPEG (`0xFF 0xD8 0xFF`) signatures before processing.
- **Stateless Authorization**: JSON Web Tokens (JWT) signed with HMAC-SHA256; passwords hashed using `bcryptjs` with 10 salt rounds.

### 5. Smart Contract Access Controls
- Modifiers `onlyOwner` and `onlyAuthorized` ensure that only accredited universities can record certificates.
- Revocation rights are restricted exclusively to the original issuing wallet address or the contract owner.
- EVM custom errors replace revert strings to prevent gas-exhaustion denial-of-service.

### 6. Privacy by Design & Data Minimization
- **Zero On-Chain PII**: Student Personally Identifiable Information (PII)—including names, roll numbers, marks, and dates of birth—is never committed to the public blockchain.
- **Cryptographic Hash Pseudonymization**: Only a 256-bit one-way cryptographic hash (`bytes32 certHash`) and an optional pseudonymized recipient ID hash (`string recipientIdHash`) are stored on-chain. This architectural design minimizes personal data exposure, facilitating alignment with GDPR Article 5(1)(c) data minimization principles and the Digital Personal Data Protection (DPDP) Act.

---

## 2. Threat Modeling & Cryptographic Defenses

| Threat Vector | Attack Mechanism | Clean-Room Defense Mechanism | Operational Boundary |
|---|---|---|---|
| **Privilege Escalation** | Client passes `role: "SUPER_ADMIN"` or `role: "INSTITUTION_ADMIN"` in public registration body | Registration endpoint forces `STUDENT` role with least-privilege defaults and returns HTTP 403 Forbidden for administrative roles. | Complete prevention of self-promoted administrative accounts. |
| **Document Forgery** | Attacker modifies student name, degree, or GPA in PDF certificate | SHA-256 avalanche effect: altering 1 bit changes the checksum, triggering an immediate `TAMPER_DETECTED` flag during binary comparison. | Verifies byte-level integrity; requires verifier to present the authentic document. |
| **Diploma Mill Impersonation** | Attacker calls smart contract directly to mint fake degrees | Contract enforces `onlyAuthorized` allowlist managed by root contract owner; unauthorized calls revert with `OnlyAuthorizedInstitutionAllowed()`. | Mitigates unauthorized transactions; requires secure onboarding of legitimate universities. |
| **Duplicate Issuance** | Institution accidentally registers the same degree multiple times | Contract checks `certificates[certHash].issuedAt == 0`, reverting on duplicate submission with `CertificateAlreadyRegistered()`. | Enforces $O(1)$ idempotency at the smart contract state layer. |
| **Cross-Tenant Revocation** | Rogue admin from Institution B attempts to revoke degree from Institution A | Controller checks `certificate.institutionCode == req.user.institutionCode` and contract verifies `msg.sender == cert.issuer`. Blocked with HTTP 403. | Strict multi-tenant isolation across all institutional operations. |
| **Unauthorized Revocation** | Malicious third party attempts to cancel a legitimate degree | Contract requires `msg.sender == cert.issuer || msg.sender == owner`, reverting unauthorized attempts with `UnauthorizedRevocation()`. | Restricts revocation strictly to the issuing university or root emergency administrator. |
| **Server-Side Injection** | Malicious templates or input executing arbitrary code | Pure in-memory vector generation via `pdf-lib` eliminates external template engines, HTML parsers, and headless Chromium execution entirely. | Eliminates remote code execution (RCE) vectors associated with server-side browser automation. |
| **Issuer Key Compromise** | An attacker steals an authorized institution's Ethereum private key | Root owner suspends institution status via `setInstitutionStatus`, and compromised certificates are revoked on-chain. Keys in custody are encrypted with PBKDF2/AES-256-GCM. | Cryptographic verification proves that an authorized private key was used; it cannot verify real-world factual claims if key custody was compromised. Hardware/KMS HSM integration recommended for enterprise production. |
| **Network Partition / Outage** | External MongoDB, IPFS, or Ethereum RPC becomes unreachable | Automated fallbacks (in-memory MongoDB, local filesystem storage) and offline demonstration mode (`OFFCHAIN_DEMO`) maintain service visibility for local evaluation. | Clearly designated as local development and academic evaluation fallbacks; off-chain demonstration mode is never represented as blockchain consensus. Production deployments require dedicated multi-node infrastructure. |

---

## 3. Reporting Vulnerabilities

If you discover a security vulnerability, please submit an issue via GitHub or contact the maintainer directly at:  
**Saqib Ahmad Bhat** &bull; Government College of Engineering, Tirunelveli.
