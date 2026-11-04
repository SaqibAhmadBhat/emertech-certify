# EMERTECH CERTIFY v2.0 — PRODUCTION SMOKE-TEST REPORT

**Lead Architect & Maintainer**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Execution Date**: November 2026  
**Target Environment**: Emertech Certify v2.0 Clean-Room Stack  
**Overall Result**: **15 / 15 SMOKE TESTS PASSING (100% OPERATIONAL READINESS)**  

---

## 1. Automated Smoke-Test Summary Matrix

| # | Verification Area | Target Endpoint / Mechanism | Test Environment | Test Condition | Observed Result | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **HTTPS Delivery** | `https://saqibahmadbhat.github.io/emertech-certify/` | **Live GitHub Pages** | TLS 1.3 handshake on edge CDN | HTTP 200 OK, SSL verified | **PASSED** |
| **2** | **SPA Client Routing** | `/verify`, `/student`, `/institution`, `/admin` | **Live GitHub Pages** | Direct URL navigation & page refresh | Rendered without 404 via `404.html` | **PASSED** |
| **3** | **API Health Probe** | `GET /api/v2/health` | **Local / CI Node.js** | System status & database connectivity | `{"status":"ONLINE","database":"CONNECTED"}` | **PASSED** |
| **4** | **Readiness Probe** | `GET /api/v2/health/ready` | **Local / CI Node.js** | Container cluster readiness | HTTP 200 `{"ready":true,"status":"READY"}` | **PASSED** |
| **5** | **Security Headers** | All HTTP responses | **Local / CI Node.js** | Header injection inspection | `nosniff`, `DENY`, `HSTS`, `CSP` confirmed | **PASSED** |
| **6** | **Rate Limiting** | `POST /api/v2/auth/login` | **Local / CI Node.js** | Rapid multi-request burst | HTTP 429 Too Many Requests on threshold | **PASSED** |
| **7** | **Mode 1: Hash Verify** | `POST /api/v2/verify/hash` | **Local Hardhat EVM** | 64-character authentic SHA-256 hash | HTTP 200 `{"status":"AUTHENTIC","onChain":true}` | **PASSED** |
| **8** | **Mode 2: PDF Upload** | `POST /api/v2/verify/file` | **Local Hardhat EVM** | Multipart binary stream upload | Stream SHA-256 matches EVM record | **PASSED** |
| **9** | **Mode 3: QR Verify** | `POST /api/v2/verify/qr` | **Local Hardhat EVM** | URL payload `?hash=0x...` | Payload decoded and anchored on-chain | **PASSED** |
| **10**| **Mode 4: OCR Scan** | `POST /api/v2/verify/ocr` | **Local Test Runner** | Synthetic certificate image scan | Tesseract.js WASM extracts student ID | **PASSED** |
| **11**| **Tamper Detection** | `POST /api/v2/verify/hash` | **Local Hardhat EVM** | 1-bit altered digest (`...197`) | HTTP 404 `TAMPER_DETECTED / UNREGISTERED` | **PASSED** |
| **12**| **Vector PDF Engine** | `GET /api/v2/certificates/:id/pdf` | **Local Test Runner** | `pdf-lib` direct vector compilation | Vector PDF streamed with dynamic QR | **PASSED** |
| **13**| **Secure Bootstrap** | `bootstrap-super-admin.js` | **Local TTY Shell** | Genesis Super Admin initialization | Terminal raw mode, zero echo, safe exit | **PASSED** |
| **14**| **Enrollment Claim** | `POST /api/v2/auth/claim-identity` | **Local DB / Server** | Hashed token + email match + race test | 403 on wrong email, 409 on race | **PASSED** |
| **15**| **RPC Downtime Resiliency**| Blockchain offline simulation | **Local Simulated RPC** | Status transition under unreachable RPC | HTTP 502, MongoDB state preserved | **PASSED** |

> [!NOTE]
> Tests 1–2 verify the live edge CDN deployment on GitHub Pages. Tests 3–15 were executed against the cleanroom backend and smart contracts running in the local integration testing environment (Node.js 20, Hardhat local EVM node at `0x5FbDB2...`, and embedded MongoDB) and through GitHub Actions CI runners. A public backend microservice must be deployed to execute tests 3–15 in a public cloud environment.

---

## 2. Detailed Verification Evidence

### Test 1 & 2: Frontend HTTPS Delivery & SPA Refresh
- **URL**: `https://saqibahmadbhat.github.io/emertech-certify/`
- **Result**: CDN edge delivers optimized React 19 production bundle (`main.3974d1a5.js` 109.56 kB gzip).
- **SPA Routing**: Direct browser reload on `https://saqibahmadbhat.github.io/emertech-certify/verify` executes `404.html` redirection script, preserving the active path and loading the Public Verification interface with zero routing degradation.

### Test 3 & 4: API Health & Readiness Probes
```bash
curl -i http://localhost:5001/api/v2/health
```
```http
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Type: application/json; charset=utf-8

{
  "status": "ONLINE",
  "system": "Emertech Certify Clean-Room Backend",
  "version": "2.0.0",
  "developer": "Saqib Ahmad Bhat",
  "institution": "Government College of Engineering, Tirunelveli",
  "database": "CONNECTED",
  "environment": "test",
  "timestamp": "2026-11-04T10:36:20.100Z"
}
```

### Test 7 & 11: Real Multi-Modal Verification & Tamper Detection
- **Authentic Hash**: `0xbf99de869e6954bc033bfd547dd056b6069959202ddbfd2bb122ef1e42d36196`
  - Response: HTTP 200 OK
  - Status: `AUTHENTIC`
  - Issuer: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Apex Institute of Technology)
  - Blockchain Anchored: `true` (TxHash: `0xedfe3c15f59cf5a26e038a412ba9b69240f6f1b9a5795eade2f64e5dd6eb6dd1`)
- **Altered Hash (Tampered)**: `0xbf99de869e6954bc033bfd547dd056b6069959202ddbfd2bb122ef1e42d36197`
  - Response: HTTP 404 Not Found
  - Status: `TAMPER_DETECTED` / `UNREGISTERED`
  - Diagnostic Notice: `No active on-chain registration matches this cryptographic document digest.`

### Test 13: Genesis Super Administrator Terminal Bootstrap
- CLI execution via `cleanroom/backend/scripts/bootstrap-super-admin.js`.
- Disables terminal echo via `process.stdin.setRawMode(true)` on TTY input streams.
- Restores terminal settings cleanly on completion, EOF (`Ctrl+D`), and interrupt (`Ctrl+C`).
- Enforces strict password policy (min 12 chars, uppercase, lowercase, digit, special character).

### Test 14: Student Enrollment Identity Claiming & Concurrency Guard
- Plaintext enrollment token is returned once to institution operator upon creation; only its SHA-256 hash (`enrollmentTokenHash`) is stored in MongoDB.
- Rejects claim attempts where authenticated account email does not match official institution email record with **HTTP 403 Forbidden**.
- Executes atomic conditional update `findOneAndUpdate({ _id, isClaimed: false })`: under concurrent claim attempts, resolves exactly one winner (HTTP 200) and safely rejects the concurrent attempt with **HTTP 409 Conflict**.

### Test 15: Blockchain Downtime Resiliency
- Simulates blockchain RPC outage at `http://127.0.0.1:9999`.
- Institutional status update returns **HTTP 502 Bad Gateway**.
- Database state in MongoDB remains unmodified at previous confirmed state (`AUTHORIZED`).
- Failure event is captured in `AuditLog` (`INSTITUTION_SUSPENSION_FAILED` / `INSTITUTION_REVOCATION_FAILED`).
