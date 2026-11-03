# Emertech Certify — Testing & Verification Guide (Clean-Room v2.0)

**Developer**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Automated Test Suite**: 14 Smart Contract Unit Tests (Hardhat) & 34 Backend Integration Tests (Live EVM Consensus) = **48 Total Passing Automated Tests** (0 Failed, 0 Skipped).

---

## 1. Automated Test Execution

You can run the full automated test suite from the repository root:

```bash
# Run Smart Contract Unit Tests (14 Tests)
cd cleanroom/contracts && npx hardhat test

# Run Backend Integration Suite (34 Tests, Auto-spawns local EVM node & deploys contract)
cd cleanroom/backend && npm test
```

---

## 2. Smart Contract Unit Tests (14 Automated Tests)

Executed on local Hardhat EVM test runner:

```bash
cd cleanroom/contracts
npx hardhat test
```

### Verified Test Cases (14/14 Passing):
1. **Deployment & Ownership**: Contract deployer correctly assigned as immutable contract owner.
2. **Deployer Root Authority**: Deployer automatically authorized as root authority in registry state.
3. **Institution Accreditation**: Contract owner authorizes academic institution wallet address.
4. **Access Control**: Non-owners strictly prevented from updating institution authorization status.
5. **Certificate Registration**: Authorized institution registers certificate with NIST SHA-256 digest.
6. **Zero-Hash Guard**: Rejection of zero-hash (`bytes32(0)`) registration.
7. **Duplicate Prevention**: Prevention of duplicate certificate registrations.
8. **Unauthorized Issuance Guard**: Rejection of certificate registration from unauthorized institutions.
9. **State Verification**: Direct smart contract verification of authentic certificate hash.
10. **Non-Existent Digest**: Unregistered hash correctly returns non-existent boolean state.
11. **Institutional Revocation**: Issuing institution successfully revokes certificate on-chain.
12. **Emergency Revocation**: Contract owner executes emergency administrative revocation.
13. **Third-Party Rejection**: Unauthorized third parties prevented from revoking certificates.
14. **Double-Revocation Guard**: Rejection of revoking an already revoked credential.

---

## 3. Backend & Cryptographic Integration Suite (34 Automated Tests)

Executed against an active, live local Hardhat EVM node with real mined transactions, real cryptographic checks, and full multi-tenant isolation:

```bash
cd cleanroom/backend
npm test
```

### Verified Scenarios (34/34 Passing):
1. **System Health Check**: GET `/api/v2/health` returns HTTP 200 and system metadata.
2. **NIST FIPS 180-4 SHA-256 Validation**: NIST Known-Answer Tests (empty string, "abc", 55-byte multi-block); validates distinction between document SHA-256 and Ethereum Keccak-256.
3. **One-Time Super Administrator Bootstrap via CLI Logic & Login**: Executes `bootstrapSuperAdmin()` CLI logic to create the initial Super Administrator (`governance.admin@emertech-test.internal`); verifies password hashing and logs in via JWT.
4. **Enforcement of One-Time Bootstrap Invariant**: Asserts that subsequent Super Administrator bootstrap attempts are safely rejected (`SUPER_ADMIN_ALREADY_EXISTS`).
5. **Prevention of Privilege Escalation (SUPER_ADMIN)**: Public registration attempting to supply `role: 'SUPER_ADMIN'` is strictly rejected with HTTP 403 Forbidden.
6. **Prevention of Privilege Escalation (INSTITUTION_ADMIN)**: Public registration attempting to supply `role: 'INSTITUTION_ADMIN'` is strictly rejected with HTTP 403 Forbidden.
7. **Least-Privilege STUDENT Role Defaults**: Public registration enforces least-privilege `STUDENT` account defaults with empty institution and wallet bindings.
8. **Academic Institution Application Queue**: Fictional institution (Apex Institute of Technology, Hardhat Account #1) applies with wallet `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.
9. **Super Admin Approval & On-Chain Accreditation**: Deploys on-chain transaction setting institution status to `2` (Authorized); verifies on-chain contract state.
10. **Failed Authorization Rejection**: Attempts to authorize an invalid Ethereum address; asserts HTTP 400 and `onChainAuthorized: false`.
11. **Unavailable Blockchain Handling**: Evaluates behavior when JSON-RPC is unreachable; asserts HTTP 502 Bad Gateway and prevents unverified database authorization.
12. **Institution Suspension Transition**: Transitions institution status to `3` (Suspended) on-chain and in MongoDB.
13. **Suspended Issuance Prevention**: Asserts that certificate issuance attempts while suspended are blocked with HTTP 403 Forbidden.
14. **Institution Reactivation**: Re-accredits institution to `2` (Authorized) on smart contract.
15. **Protected Institution Admin Provisioning**: Authenticated Super Admin provisions Institution Administrator account via `POST /api/v2/admin/institutions/:id/provision-admin`; asserts linkage to accredited institution code and wallet.
16. **Unauthorized Admin Provisioning Rejection**: Non-Super Admin (Student) attempting to provision administrators is rejected with HTTP 403 Forbidden.
17. **Unaccredited Institution Admin Provisioning Guard**: Attempting to provision an admin for a pending/unaccredited institution is rejected with HTTP 400 Bad Request.
18. **Negative RBAC: Student Blocked from Issuance**: Student account attempting to invoke `/api/v2/institutions/issue` is rejected with HTTP 403 Forbidden.
19. **Persistent Key Custody (AES-256-GCM via PBKDF2 & Database Signer)**: Stores encrypted private key in MongoDB using PBKDF2 derived vault key; resets in-memory cache; resolves signer from database record; verifies cryptographic message signing and address recovery.
20. **Real On-Chain Issuance with Institutional Signature**: Mined transaction on EVM; asserts `msg.sender` and `onChainRecord.issuer` strictly match institution wallet `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.
21. **Vector PDF Download Endpoint**: Downloads dynamically compiled vector PDF with QR verification stamp.
22. **Mode 1: Hash Verification**: Verifies SHA-256 hash against EVM; displays verified on-chain issuer wallet address.
23. **Mode 2: Binary File Upload**: Recomputes SHA-256 on uploaded PDF; matches bitwise hash with live contract.
24. **Bitwise Tamper Detection**: Flips bits in PDF; asserts immediate classification as `TAMPER_DETECTED`.
25. **Mode 3: QR Code Verification**: Extracts SHA-256 payload from QR string and verifies against blockchain state.
26. **Student Credential Retrieval**: Retrieves student transcripts and verified certificates (`/api/v2/certificates/student/my-certificates`).
27. **Negative RBAC: Multi-Tenant Revocation Isolation**: Institution Admin attempting to revoke a certificate belonging to another institution is rejected with HTTP 403 Forbidden.
28. **Institutional On-Chain Revocation**: Issuing institution signs revocation transaction; contract confirms `isRevoked: true`.
29. **Unauthorized Revocation Prevention**: Student attempts revocation; blocked with HTTP 403 Forbidden.
30. **Revoked Credential Verification**: Confirms status `REVOKED` directly from smart contract view method.
31. **Mode 4: Neural OCR Extraction**: Tesseract.js neural OCR parses synthetic certificate image fixture (`synthetic-test-certificate.png`); extracts student name and ID.
32. **File Upload Magic Byte Enforcement**: Asserts that non-PDF files uploaded to `/verify/file` and non-image files uploaded to `/verify/ocr` are rejected with HTTP 400 Bad Request.
33. **Batch Certificate Issuance**: Processes multi-student batch with genuine institutional transaction signing.
34. **Super Admin Telemetry**: Aggregates governance analytics across active, revoked, and institutional records.

---

## 4. Execution Environments & Offline Fallback Architecture

Emertech Certify strictly differentiates between four operating modes:

| Mode | Blockchain Layer | Transaction Reality | Verification Status | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Local EVM Node** | Local Hardhat JSON-RPC (`http://127.0.0.1:8545`) | Real mined Ethereum transactions, real gas execution, valid 66-character hashes | `AUTHENTIC` (onChainVerified: true) | Local testing, continuous integration, viva demonstrations |
| **Public Testnet** | Ethereum Sepolia / Holesky | Real public blockchain transactions requiring testnet ETH | `AUTHENTIC` (onChainVerified: true) | Public academic staging, decentralized multi-node validation |
| **Off-Chain Demonstration** | None (RPC unavailable or disconnected) | No on-chain anchoring (`onChain: false`, `txHash: null`) | `OFFCHAIN_DEMO` (onChainVerified: false) | Local UI walkthrough when no Ethereum node is started |
| **Database-Only Records** | MongoDB Cache | Off-chain metadata cache | `OFFCHAIN_DEMO` | Fast indexing, caching, student transcript retrieval |

> [!WARNING]
> Off-chain demonstration mode is **never** presented as blockchain verification. The verification interface clearly labels off-chain records as `OFFCHAIN_DEMO` with diagnostic notices indicating absence of smart contract consensus.
