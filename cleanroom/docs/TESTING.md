# Emertech Certify — Testing & Verification Guide (Clean-Room v2.0)

**Developer**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Automated Test Suite**: 14 Smart Contract Unit Tests (Hardhat) & 25 Backend Integration Tests (Live EVM Consensus).  

---

## 1. Automated Test Execution

You can run the full automated test suite from the repository root:

```bash
# Run Smart Contract Unit Tests
cd cleanroom/contracts && npx hardhat test

# Run Backend Integration Suite (Auto-spawns local EVM node & deploys contract)
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

## 3. Backend & Cryptographic Integration Suite (25 Automated Tests)

Executed against an active, live local Hardhat EVM node with real mined transactions:

```bash
cd cleanroom/backend
npm test
```

### Verified Scenarios (25/25 Passing):
1. **System Health Check**: GET `/api/v2/health` returns HTTP 200 and system metadata.
2. **NIST FIPS 180-4 SHA-256 Validation**: NIST Known-Answer Tests (empty string, "abc", 55-byte multi-block); validates distinction between document SHA-256 and Ethereum Keccak-256.
3. **Super Admin Registration & Login**: Registers governance administrator and returns signed JWT.
4. **Institution Application Queue**: Fictional institution (Apex Institute of Technology, Hardhat Account #1) applies with wallet `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.
5. **Super Admin Approval & On-Chain Accreditation**: Deploys on-chain transaction setting institution status to `2` (Authorized); verifies on-chain contract state.
6. **Failed Authorization Rejection**: Attempts to authorize an invalid Ethereum address; asserts HTTP 400 and `onChainAuthorized: false`.
7. **Unavailable Blockchain Handling**: Evaluates behavior when JSON-RPC is unreachable; asserts HTTP 502 and prevents unverified database authorization.
8. **Institution Suspension Transition**: Transitions institution status to `3` (Suspended) on-chain and in MongoDB.
9. **Suspended Issuance Prevention**: Asserts that certificate issuance attempts while suspended are blocked with HTTP 403 Forbidden.
10. **Institution Reactivation**: Re-accredits institution to `2` (Authorized) on smart contract.
11. **Authorized Institution Admin Login**: Generates JWT token for accredited institution administrator.
12. **Student Account Registration**: Registers fictional student (Jane H. Doe, `STU-2026-0042`) linked to institution.
13. **Real On-Chain Issuance with Institutional Signature**: Mined transaction on EVM; asserts `msg.sender` and `onChainRecord.issuer` match institution wallet `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.
14. **Vector PDF Download Endpoint**: Downloads dynamically compiled vector PDF with QR verification stamp.
15. **Mode 1: Hash Verification**: Verifies SHA-256 hash against EVM; displays verified on-chain issuer wallet address.
16. **Mode 2: Binary File Upload**: Recomputes SHA-256 on uploaded PDF; matches bitwise hash with live contract.
17. **Bitwise Tamper Detection**: Flips bits in PDF; asserts immediate classification as `TAMPER_DETECTED`.
18. **Mode 3: QR Code Verification**: Extracts SHA-256 payload from QR string and verifies against blockchain state.
19. **Student Credential Retrieval**: Retrieves student transcripts and verified certificates.
20. **Institutional On-Chain Revocation**: Issuing institution signs revocation transaction; contract confirms `isRevoked: true`.
21. **Unauthorized Revocation Prevention**: Student or non-issuer attempts revocation; blocked with HTTP 403 Forbidden.
22. **Revoked Credential Verification**: Confirms status `REVOKED` directly from smart contract view method.
23. **Mode 4: Neural OCR Extraction**: Tesseract.js neural OCR parses synthetic certificate image fixture (`synthetic-test-certificate.png`); extracts student name and ID.
24. **Batch Certificate Issuance**: Processes multi-student batch with genuine institutional transaction signing.
25. **Super Admin Telemetry**: Aggregates governance analytics across active, revoked, and institutional records.

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
