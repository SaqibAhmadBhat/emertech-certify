# Emertech Certify — Security Policy & Threat Model (Clean-Room v2.0)

**Architect**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  

---

## 1. Security Architecture & Invariants

Emertech Certify v2.0 was developed under a strict clean-room engineering process to prevent common web3 and cryptographic vulnerabilities:

### 1. Zero Credential Exposure
- No private keys, mnemonics, API secrets, or passwords are hardcoded in source code or documentation.
- The repository `.gitignore` explicitly prevents `.env` and sensitive files from being tracked in Git.

### 2. Password & Session Security
- User passwords are salted (10 rounds) and hashed using `bcryptjs`.
- Stateless authorization is enforced using JSON Web Tokens (JWT) signed with a dedicated HMAC secret.

### 3. Smart Contract Access Controls
- Modifiers `onlyOwner` and `onlyAuthorized` ensure that only accredited universities can record certificates.
- Revocation rights are restricted exclusively to the original issuing wallet address or the contract owner.
- EVM custom errors replace revert strings to prevent gas-exhaustion denial-of-service.

### 4. Privacy by Design & Data Minimization
- **Zero On-Chain PII**: Student Personally Identifiable Information (PII)—including names, roll numbers, marks, and dates of birth—is never committed to the public blockchain.
- **Cryptographic Hash Pseudonymization**: Only a 256-bit one-way cryptographic hash (`bytes32 certHash`) and an optional pseudonymized recipient ID hash (`string recipientIdHash`) are stored on-chain. This architectural design minimizes personal data exposure, facilitating alignment with GDPR Article 5(1)(c) data minimization principles and the Digital Personal Data Protection (DPDP) Act.

---

## 2. Threat Modeling & Cryptographic Defenses

| Threat Vector | Attack Mechanism | Clean-Room Defense Mechanism | Operational Boundary |
|---|---|---|---|
| **Document Forgery** | Attacker modifies student name, degree, or GPA in PDF certificate | SHA-256 avalanche effect: altering 1 bit changes the checksum, triggering an immediate `TAMPER_DETECTED` flag during binary comparison. | Verifies byte-level integrity; requires verifier to present the authentic document. |
| **Diploma Mill Impersonation** | Attacker calls smart contract directly to mint fake degrees | Contract enforces `onlyAuthorized` allowlist managed by root contract owner; unauthorized calls revert with `OnlyAuthorizedInstitutionAllowed()`. | Mitigates unauthorized transactions; requires secure onboarding of legitimate universities. |
| **Duplicate Issuance** | Institution accidentally registers the same degree multiple times | Contract checks `certificates[certHash].issuedAt == 0`, reverting on duplicate submission with `CertificateAlreadyRegistered()`. | Enforces $O(1)$ idempotency at the smart contract state layer. |
| **Unauthorized Revocation** | Malicious third party attempts to cancel a legitimate degree | Contract requires `msg.sender == cert.issuer || msg.sender == owner`, reverting unauthorized attempts with `UnauthorizedRevocation()`. | Restricts revocation strictly to the issuing university or root emergency administrator. |
| **Server-Side Injection** | Malicious templates or input executing arbitrary code | Pure in-memory vector generation via `pdf-lib` eliminates external template engines, HTML parsers, and headless Chromium execution entirely. | Eliminates remote code execution (RCE) vectors associated with server-side browser automation. |
| **Issuer Key Compromise** | An attacker steals an authorized institution's Ethereum private key | The root owner can immediately suspend or revoke the institution's status via `setInstitutionStatus`, and compromised certificates can be revoked on-chain. | Cryptographic verification proves that an authorized private key was used; it cannot verify real-world factual claims if key custody was compromised. Multi-sig or hardware wallet key management is recommended for production. |
| **Network Partition / Outage** | External MongoDB, IPFS, or Ethereum RPC becomes unreachable | Automated fallback mechanisms (in-memory MongoDB, local filesystem storage, fallback provider) maintain service continuity for evaluation. | Clearly designated as local development and academic evaluation fallbacks; production deployments require dedicated multi-node infrastructure. |

---

## 3. Reporting Vulnerabilities

If you discover a security vulnerability, please submit an issue via GitHub or contact the maintainer directly at:  
**Saqib Ahmad Bhat** &bull; Government College of Engineering, Tirunelveli.
