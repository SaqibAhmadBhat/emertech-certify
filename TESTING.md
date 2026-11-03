# Emertech Certify — Verification and Testing Report

**Project Title**: AI-Assisted Blockchain-Based Academic Certificate Verification System  
**Developer**: Saqib Ahmad Bhat  
**Department**: Computer Science and Engineering  
**Institution**: Government College of Engineering, Tirunelveli  
**Test Environment**: macOS (Darwin Kernel, Apple Silicon), Node.js v22.23.3, npm 10.9.9  
**Execution Date**: November 2026  

---

## 1. Executive Testing Summary

All 15 verification areas mandated by the project requirements were executed against the actual code. Zero errors or test failures remain.

| # | Verification Area | Target Layer | Command Executed | Result |
|---|---|---|---|---|
| 1 | Dependency Installation | Root / Contracts / Backend / Frontend | `npm install` across tiers | ✅ 100% Installed |
| 2 | Solidity Compilation | Smart Contracts | `npx hardhat compile` | ✅ 0.8.19 Compiled |
| 3 | Smart Contract Deployment | Local Hardhat EVM | `npx hardhat run scripts/deploy.js` | ✅ Deployed (`0x5FbDB2...`) |
| 4 | Backend Startup | Node.js / Express | `npm start` (port 5001) | ✅ Server & In-Memory DB Online |
| 5 | Frontend Production Build | React 19 SPA | `CI=true npm run build` | ✅ Compiled cleanly (0 warnings) |
| 6 | Admin Auth & Approval | Backend Auth & Admin | Automated Test 2 & 4 | ✅ Verified |
| 7 | Certificate Issuance | Issuance Pipeline | Automated Test 8 | ✅ Verified |
| 8 | PDF Generation | Puppeteer Headless | Automated Test 8 | ✅ A4 PDF rendered on disk |
| 9 | SHA-256 Verification | Verification Engine | Automated Test 10 | ✅ Cryptographic digest match |
| 10 | QR Code Verification | QR Decoder & API | Automated Test 9 & 10 | ✅ Verified URL & Payload |
| 11 | Modification Detection | Tamper Detection | Automated Test 11 | ✅ Flagged TAMPERED |
| 12 | Revocation Pipeline | Smart Contract & DB | Automated Test 14 & 15 | ✅ Status = REVOKED |
| 13 | API Suite Execution | End-to-End REST API | `node test/api.test.js` | ✅ 17/17 Tests Passed |
| 14 | Security Sanitation | Codebase Audit | Secret Scans & Audits | ✅ 0 Credentials in Repo |
| 15 | AI OCR Module | Tesseract.js / PDF Parser | Automated Test 17 | ✅ Extracted fields verified |

---

## 2. Smart Contract Unit Test Results

### Command Executed:
```bash
cd contracts && npm test
```

### Actual Terminal Output:
```
> emertech-certify-contracts@1.0.0 test
> hardhat test

  CertificateRegistry (Emertech Certify)
    ✔ Should set the deployer as owner and authorized issuer (637ms)
    ✔ Should allow the owner to authorize an institution wallet (45ms)
    ✔ Should issue a certificate with SHA-256 document hash (51ms)
    ✔ Should prevent duplicate certificate IDs
    ✔ Should reject issuance from unauthorized callers
    ✔ Should verify authentic certificates with matching SHA-256 hash (41ms)
    ✔ Should detect tampered certificate with mismatched hash
    ✔ Should support certificate revocation and update verification status (46ms)
    ✔ Should prevent unauthorized revocation by third parties (44ms)

  9 passing (884ms)
```

---

## 3. End-to-End Backend REST API & AI OCR Test Results

### Command Executed:
```bash
cd backend && node test/api.test.js
```

### Actual Terminal Output:
```
====================================================
🧪 Starting Emertech Certify Automated API Test Suite
👨‍💻 Developer: Saqib Ahmad Bhat
====================================================

ℹ️ Local MongoDB daemon not detected. Initializing embedded in-memory MongoDB server...
✅ Embedded in-memory MongoDB initialized successfully at: mongodb://127.0.0.1:12233/
ℹ️ Running in self-contained demonstration mode (no external database required).
=================================================
🎓 Emertech Certify Backend running on port 5001
👨‍💻 Developer: Saqib Ahmad Bhat
🏛️ Institution: Government College of Engineering, Tirunelveli
🚀 Verification Engine & AI OCR Module Online
=================================================
1. Testing System Health Check...
   ✅ Health check passed. Developer: Saqib Ahmad Bhat

2. Testing Administrator Authentication...
   ✅ Admin authentication successful. JWT received.

3. Testing Institution Registration (Onboarding Queue)...
   ✅ Institution registration queued for administrator approval.

4. Testing Admin Institutional Approval...
   ✅ Institution approved. Assigned University ID: un01

5. Testing Approved Institution Login...
   ✅ Institution login authorized.

6. Testing Student Account Registration & Login...
   ✅ Student registration and authentication successful.

7. Testing Template Provisioning...
   ✅ Templates available: 4. Selected Template: Semester Marks Card

8. Testing Academic Certificate Issuance Pipeline...
ℹ️ Stored locally with hash 0xbf984248a76ddf9a862be88e1caa205c20f667e260779ce1de2dd72679b1a4b3 (local CID: local-ipfs-bf984248a76ddf9a862be88e1caa205c20f667e2)
   ✅ Certificate generated successfully!
      Blockchain ID: UN01-CERT-EZLRZT-20261103
      SHA-256 Hash: 0xbf984248a76ddf9a862be88e1caa205c20f667e260779ce1de2dd72679b1a4b3
      Storage Type: local

9. Testing Public Verification by Certificate ID...
   ✅ Public verification by ID: Status = AUTHENTIC

10. Testing Public Verification by Original PDF Upload...
Verifying uploaded PDF. Computed SHA-256: 0xbf984248a76ddf9a862be88e1caa205c20f667e260779ce1de2dd72679b1a4b3
   ✅ Uploaded PDF verified: Status = AUTHENTIC (Cryptographic digest matches)

11. Testing Tamper Detection on Modified PDF Document...
   ✅ Tampering detected! Status = TAMPERED (Hash mismatch flagged)

12. Testing Public Verification by QR Code Payload...
   ✅ QR Code verification successful: Status = AUTHENTIC (Resolved ID: UN01-CERT-...)

13. Testing Certificate PDF Download Endpoint...
   ✅ PDF Download verified: HTTP 200 with application/pdf Content-Type (107052 bytes)

14. Testing Certificate Revocation Pipeline...
   ✅ Certificate revoked successfully.

15. Testing Public Verification of Revoked Certificate...
   ✅ Revocation confirmed! Status = REVOKED. Reason: "Administrative correction: Updated course syllabus"

16. Testing Student Dashboard Retrieval...
   ✅ Student certificates successfully retrieved from student portal.

17. Testing AI-Assisted Certificate Information Extraction (OCR)...
   ✅ AI OCR Module successfully processed document!
      Engine: PDF Text Stream Parser
      Detected Student: Saqib Ahmad Bhat
      Detected Course: B.E
      Disclaimer present: true

====================================================
🎉 ALL 17 AUTOMATED API & AI TESTS PASSED SUCCESSFULLY!
====================================================
```

---

## 4. Frontend Production Build Verification

### Command Executed:
```bash
cd frontend/certiport-frontend && CI=true npm run build
```

### Actual Terminal Output:
```
> certiport-frontend@0.1.0 build
> react-scripts build

Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  87.38 kB  build/static/js/main.e7b389cd.js
  6.27 kB   build/static/css/main.70126575.css

The project was built assuming it is hosted at /.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.
```

---

## 5. Security & Secret Sanitation Audit

- **Exposed Private Key Scan**: Scanned codebase for hardcoded 256-bit hexadecimal private keys. The compromised key previously found in `contracts/getAddress.js` was completely excised.
- **Log Sanitation**: Checked all backend controllers. The plaintext console logging of administrative credentials in `backend/controllers/authController.js` was permanently removed.
- **Environment Isolation**: Checked `.gitignore` to verify all `.env` files are strictly excluded from version control while preserving `.env.example` templates.

