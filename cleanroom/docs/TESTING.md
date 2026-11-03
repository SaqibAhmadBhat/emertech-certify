# Emertech Certify — Testing & Verification Guide (Clean-Room v2.0)

**Developer**: Saqib Ahmad Bhat  
**Test Suite Coverage**: 100% of Clean-Room Smart Contracts (14/14) & Backend API Workflows (18/18).  

---

## 1. Automated Test Execution

You can run the full test suite with a single command from `cleanroom/`:

```bash
npm run test:all
```

---

## 2. Smart Contract Unit Tests (Hardhat)

```bash
cd cleanroom/contracts
npx hardhat test
```

### Verified Scenarios (14/14 Passing):
1. Contract deployer correctly assigned as owner.
2. Deployer automatically authorized as root authority.
3. Owner authorizes academic institution wallet.
4. Non-owners prevented from updating institution status.
5. Authorized institution registers certificate with SHA-256 digest.
6. Rejection of zero-hash registration.
7. Prevention of duplicate certificate registrations.
8. Rejection of issuance from unauthorized institutions.
9. Verification of authentic certificate hash.
10. Unregistered hash returns non-existent state.
11. Issuing institution successfully revokes certificate.
12. Contract owner emergency revocation.
13. Unauthorized third parties prevented from revoking.
14. Rejection of revoking an already revoked certificate.

---

## 3. Backend & Cryptographic Integration Tests

```bash
cd cleanroom/backend
node test/cleanroom.api.test.js
```

### Verified Scenarios (18/18 Passing):
1. System health check endpoint.
2. Super Admin registration and JWT authentication.
3. Institution onboarding application queue.
4. Admin approval and on-chain authorization.
5. Authorized institution login.
6. Student registration and institution linkage.
7. Deterministic certificate issuance and vector PDF compilation.
8. Vector PDF download endpoint.
9. Mode 1: Public verification by hash.
10. Mode 2: Verification by PDF binary upload (exact match).
11. Bitwise tamper detection on modified PDF.
12. Mode 3: QR code payload verification.
13. Student credential retrieval.
14. On-chain certificate revocation pipeline.
15. Verification of revoked credential.
16. Mode 4: Tesseract.js neural OCR image extraction.
17. Batch certificate issuance.
18. Super Admin telemetry metrics.
