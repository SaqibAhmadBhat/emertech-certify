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

### 4. Privacy by Design (GDPR / DPDP Compliance)
- No Personally Identifiable Information (PII) is committed to the blockchain.
- Only a 256-bit one-way cryptographic hash (`bytes32 certHash`) is stored on-chain, rendering reverse-engineering of student data impossible.

---

## 2. Threat Modeling & Defenses

| Threat Vector | Attack Mechanism | Clean-Room Defense Mechanism |
|---|---|---|
| **Document Forgery** | Attacker modifies student name or GPA in PDF certificate | SHA-256 avalanche effect: altering 1 bit changes the checksum, triggering `TAMPER_DETECTED`. |
| **Diploma Mill Impersonation** | Attacker calls smart contract to mint fake degrees | Contract enforces `onlyAuthorizedInstitution` allowlist managed by root owner. |
| **Duplicate Issuance** | Institution accidentally registers same degree twice | Contract checks `certificates[certHash].issuedAt == 0`, reverting on duplicates. |
| **Unauthorized Revocation** | Competitor or malicious party attempts to cancel a valid degree | Contract requires `msg.sender == cert.issuer || msg.sender == owner`. |
| **Server-Side Template Injection** | Insecure template uploads allowing arbitrary code execution | Pure vector generation via `pdf-lib` eliminates template engines and Chromium execution entirely. |

---

## 3. Reporting Vulnerabilities

If you discover a security vulnerability, please submit an issue via GitHub or contact the maintainer directly at:  
**Saqib Ahmad Bhat** &bull; Government College of Engineering, Tirunelveli.
