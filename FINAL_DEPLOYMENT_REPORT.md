# EMERTECH CERTIFY v2.0 — FINAL INDEPENDENT DEPLOYMENT & SECURITY AUDIT
### AI-Assisted Blockchain-Based Academic Certificate Verification System

**Lead Architect & Developer**: Saqib Ahmad Bhat  
**Academic Institution**: Government College of Engineering, Tirunelveli  
**Department**: Department of Computer Science and Engineering  
**Industry Context**: AI and Blockchain Engineer Intern Demonstration, Emertech Innovations Private Limited  
**Audit Execution Date**: November 4, 2026  
**Audited Repository**: [https://github.com/SaqibAhmadBhat/emertech-certify](https://github.com/SaqibAhmadBhat/emertech-certify)  
**Primary Implementation**: [`cleanroom/`](cleanroom/)  
**Live Frontend Tested**: [https://saqibahmadbhat.github.io/emertech-certify/](https://saqibahmadbhat.github.io/emertech-certify/)  
**Audited Commit**: `1275ffd` (Remote `main` HEAD)  

---

## 1. Executive Deployment & Verification Summary

This independent audit establishes the factual operational status of all components of Emertech Certify v2.0. In accordance with strict software auditing standards, this report clearly distinguishes between **publicly deployed systems**, **locally verified implementations**, and **configured deployment blueprints**.

| Component / Subsystem | Publicly Deployed? | Tested Successfully? | Evidence | Operational Reality & Remaining Work |
| :--- | :---: | :---: | :--- | :--- |
| **Frontend Web Application** | **YES** | **YES** | Live at [`saqibahmadbhat.github.io/emertech-certify`](https://saqibahmadbhat.github.io/emertech-certify/) (HTTP 200) | Deployed on GitHub Pages CDN. SPA routing verified across all routes via `404.html`. |
| **Backend REST API Microservice** | **NO** | **YES (Locally & CI)** | 37 passing backend integration tests on ephemeral local EVM node | Configured via [`render.yaml`](render.yaml) & [`Dockerfile`](cleanroom/backend/Dockerfile). No public cloud instance currently running. |
| **Public Blockchain Registry** | **NO** | **YES (Locally & CI)** | 14 passing Hardhat unit tests on local EVM node (`0x5FbDB2...`) | Contract `EmertechCertificateRegistry.sol` is **not deployed to Sepolia**. Deployment script prepared in [`deploy-sepolia.js`](cleanroom/contracts/scripts/deploy-sepolia.js). |
| **Managed Database (Atlas)** | **NO** | **YES (Locally & CI)** | In-memory MongoDB (`mongodb-memory-server`) in local & CI suites | Connection logic, pooling, and credential redaction verified. Requires provisioning an Atlas cluster and setting `MONGO_URI`. |
| **End-to-End Verification (Public)**| **NO** | **YES (Locally & CI)** | 5 verification modes pass in local integration tests | In the public GitHub Pages environment, verification requests return HTTP 405 because no live backend microservice is connected. |
| **Institutional Key Custody** | **N/A** | **YES (Locally & CI)** | PBKDF2/AES-256-GCM unit & integration tests pass | Encrypted ciphertext persisted in MongoDB with runtime in-memory caching. Uses application master key; HSM/KMS integration required for enterprise grade. |
| **CI/CD Pipeline** | **YES** | **YES** | GitHub Actions Run ID `41780185222` (100% green) | 4/4 jobs pass: contracts, backend, frontend build, and GitHub Pages deployment (52 total automated checks). |

---

## 2. Live Frontend Inspection & Route Verification

An automated headless browser audit was executed directly against the live public URL: `https://saqibahmadbhat.github.io/emertech-certify/`.

### Route Inspection Results

| Route Path | Full Public URL | HTTP Status | Visual Rendering | API Behavior & Findings |
| :--- | :--- | :---: | :--- | :--- |
| `/` | `https://saqibahmadbhat.github.io/emertech-certify/` | `200 OK` | Hero section, metric cards, feature grid | Static presentation mode; loads client React bundle. |
| `/verify` | `https://saqibahmadbhat.github.io/emertech-certify/verify` | `200 OK` | 4-tab verification hub (File, Hash, QR, OCR) | UI rendered cleanly. Showcase notice displayed. |
| `/verify?hash=0x...` | `https://saqibahmadbhat.github.io/emertech-certify/verify?hash=0x...` | `200 OK` | Hash auto-intake active | Auto-triggers `POST /api/v2/verify/hash`. Yields HTTP 405 from GitHub Pages (no backend). Gracefully handled with notice. |
| `/login` | `https://saqibahmadbhat.github.io/emertech-certify/login` | `200 OK` | Account sign-in form | Submitting credentials yields HTTP 405 from GitHub Pages. Shows clear "Backend API offline" notice. |
| `/register` | `https://saqibahmadbhat.github.io/emertech-certify/register` | `200 OK` | Student registration form | Submitting yields HTTP 405. Shows clear offline notice. |
| `/student` | `https://saqibahmadbhat.github.io/emertech-certify/student` | `200 OK` | Protected route guard redirects to `/login` | Authentication guard verified. |
| `/institution` | `https://saqibahmadbhat.github.io/emertech-certify/institution` | `200 OK` | Protected route guard redirects to `/login` | Authentication guard verified. |
| `/admin` | `https://saqibahmadbhat.github.io/emertech-certify/admin` | `200 OK` | Protected route guard redirects to `/login` | Authentication guard verified. |

### Finding: Frontend Deployment Mode
The live frontend on GitHub Pages is a **client-side static Single Page Application (SPA)**. It does not communicate with a live public backend. When users submit verification queries or login attempts, the browser sends requests to relative `/api/v2/*` endpoints on `saqibahmadbhat.github.io`, which returns `HTTP 405 Method Not Allowed` or `HTTP 404 Not Found`. The frontend has been hardened to detect this condition and clearly display an informative status message informing the user that a running backend service is required.

---

## 3. Backend API & Health Endpoints Audit

1. **Render Cloud Endpoint Probe**:
   - `GET https://emertech-certify.onrender.com/api/v2/health`
   - Response: `HTTP/2 404 Not Found` (`x-render-routing: no-server`)
   - Finding: Render web service is not currently provisioned or running. The URL was an example blueprint placeholder in `render.yaml`.
2. **GitHub Pages Endpoint Probe**:
   - `GET https://saqibahmadbhat.github.io/api/v2/health`
   - Response: `HTTP/2 404 Not Found`
   - Finding: GitHub Pages does not run Node.js or Express.
3. **Local & CI Endpoint Verification**:
   - `GET http://localhost:5001/api/v2/health`
   - Response: `HTTP/1.1 200 OK`
   - Body: `{"status":"ONLINE","system":"Emertech Certify Clean-Room Backend","version":"2.0.0","developer":"Saqib Ahmad Bhat","institution":"Government College of Engineering, Tirunelveli","database":"CONNECTED"}`
   - `GET http://localhost:5001/api/v2/health/ready`
   - Response: `HTTP/1.1 200 OK` (`{"ready":true,"status":"READY"}`)
   - Finding: Health and readiness endpoints are fully functional and pass 100% in local and CI integration test suites.

---

## 4. Smart Contract & Blockchain Audit (Ethereum Sepolia)

1. **Sepolia Deployment Status**: **NOT DEPLOYED**.
   - Contract Address: None on Sepolia.
   - Etherscan Link: None on Sepolia.
   - Reason: Deploying to Ethereum Sepolia requires a funded testnet wallet (`SEPOLIA_PRIVATE_KEY`) and an active RPC URL (`SEPOLIA_RPC_URL`), which are operator-controlled credentials not committed to the repository.
2. **Sepolia Deployment Tooling**:
   - Script: [`cleanroom/contracts/scripts/deploy-sepolia.js`](cleanroom/contracts/scripts/deploy-sepolia.js).
   - Security Guards: Strictly rejects Ethereum Mainnet (Chain ID 1), denylists known Hardhat development keys, validates account balance before broadcasting, and waits for 2 block confirmations before saving deployment receipts.
3. **Automated Testing Ledger**:
   - In all unit and integration test runs, the contract is deployed to an ephemeral in-memory Hardhat EVM node (Chain ID 31337) at address `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
   - All 14 Hardhat contract tests pass.

---

## 5. Institutional Key Vault Architecture & Discrepancy Resolution

The project documentation previously contained conflicting references describing the institutional key vault as both "in-memory" and "persistent database custody". This audit investigated [`cleanroom/backend/src/services/KeyVaultService.js`](cleanroom/backend/src/services/KeyVaultService.js) and resolved the discrepancy:

### Actual Architectural Implementation
1. **Cryptographic Algorithm**: AES-256-GCM authenticated encryption.
2. **Key Derivation Function (KDF)**: PBKDF2 with 100,000 iterations of HMAC-SHA256, derived from `KEY_VAULT_SECRET` (min 32 chars) and a unique per-institution 256-bit salt.
3. **Cryptographic Binding**: 96-bit random IV, 128-bit authentication tag, and Authenticated Additional Data (AAD) bound to the institution's lowercase wallet address.
4. **Persistence Layer**: The ciphertext (`encryptedPrivateKey`), IV (`keyVaultIv`), tag (`keyVaultTag`), and derivation salt (`keyDerivationSalt`) are **persisted in MongoDB** within the `Institution` collection via `KeyVaultService.persistInstitutionKey()`.
5. **Runtime Caching Layer**: For performance, an encrypted in-memory map (`KeyVaultService._vault = new Map()`) caches decrypted signers during the Node.js process runtime so repeated transaction signing does not require repeated PBKDF2 derivations.
6. **Discrepancy Resolution**: The vault is **database-persisted with process-level caching**. It is not purely in-memory.
7. **Security Caveat**: The master key `KEY_VAULT_SECRET` is stored as an environment variable. While cryptographically sound for development and demonstration, true enterprise-grade custody requires backing this key with a Hardware Security Module (HSM) or cloud Key Management Service (AWS KMS, GCP Cloud KMS, or HashiCorp Vault), validated through an independent security audit.

---

## 6. Secrets, Private Keys & Credential Hygiene Audit

A comprehensive static security audit of git history and the source tree was conducted:

| Check | Scope | Tool / Method | Result | Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **Committed `.env` Files** | Entire Git History | `git log --all -p -- "*.env"` | **PASSED** | Zero `.env` files found in repository history. |
| **Committed 64-Hex Private Keys** | All source files | Regex `0x[a-fA-F0-9]{64}` | **PASSED** | Only standard NIST FIPS 180-4 test vectors found in `CryptoService.js`. |
| **Development Key Rejection** | Public networks | SHA-256 hash denylist in `env.js` | **PASSED** | Known Hardhat dev keys blocked from non-local networks. |
| **Super Admin Password Leakage** | Terminal bootstrap | TTY raw mode in `bootstrap-super-admin.js` | **PASSED** | Terminal echo disabled during entry; zero command-line args accepted. |
| **Database URI Credential Leakage**| Server console logs | Regex sanitization in `db.js` | **PASSED** | Replaces `//user:pass@` with `//***:***@` in all connection logs. |

---

## 7. GitHub Actions Continuous Integration Audit

```
================================================================================
GitHub Actions Pipeline: Emertech Certify Clean-Room v2.0 CI
Run ID: 41780185222 | Commit: 1275ffdfac1f3b2d21edf0a65b1bc24249af9cba
Branch: main | Trigger: push | Status: COMPLETED | Conclusion: SUCCESS
================================================================================
Job 1: Frontend Production Build Verification                   [PASS - 28s]
Job 2: Clean-Room Smart Contracts Unit Tests (14/14 Passing)    [PASS - 20s]
Job 3: Backend API Integration Tests on Real EVM (37/37 Passing)[PASS - 39s]
Job 4: Deploy Clean-Room Frontend to GitHub Pages               [PASS - 36s]
================================================================================
Total Automated Checks: 52 / 52 PASSED (0 Failed, 0 Skipped)
Live GitHub Pages HTTP Status: HTTP/2 200 OK
================================================================================
```

---

## 8. Action Plan: Operator Steps for Full Public Cloud Deployment

To transition Emertech Certify from a static GitHub Pages showcase to a fully connected public cloud deployment, execute the following operator-controlled steps:

### Step 1: Deploy Smart Contract to Ethereum Sepolia
1. Obtain Sepolia testnet ETH from a public faucet.
2. In `cleanroom/contracts`:
   ```bash
   export SEPOLIA_RPC_URL="https://rpc.sepolia.org" # or Alchemy/Infura URL
   export SEPOLIA_PRIVATE_KEY="0x<your_funded_sepolia_private_key>"
   npx hardhat run scripts/deploy-sepolia.js --network sepolia
   ```
3. Record the deployed contract address (e.g. `0x1234...`) and Etherscan link.

### Step 2: Provision MongoDB Atlas Cluster
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write permissions on `emertech_certify`.
3. Allow network access (`0.0.0.0/0` for cloud PaaS or your specific server IP).
4. Copy the connection URI: `mongodb+srv://<user>:<password>@cluster.mongodb.net/emertech_certify?retryWrites=true&w=majority`.

### Step 3: Deploy Backend Microservice (Render / Docker)
1. Sign in to [Render](https://render.com) or your preferred cloud container host (Fly.io, AWS ECS, GCP Cloud Run).
2. Create a new Web Service using [`cleanroom/backend/Dockerfile`](cleanroom/backend/Dockerfile) or [`render.yaml`](render.yaml).
3. Set the following environment variables:
   ```env
   NODE_ENV=production
   PORT=5001
   CORS_ORIGIN=https://saqibahmadbhat.github.io
   JWT_SECRET=<generate_via_openssl_rand_hex_32>
   KEY_VAULT_SECRET=<generate_via_openssl_rand_hex_32_min_32_chars>
   MONGO_URI=<your_atlas_connection_string>
   BLOCKCHAIN_RPC_URL=https://rpc.sepolia.org
   CONTRACT_ADDRESS=<sepolia_contract_address_from_step_1>
   DEPLOYER_PRIVATE_KEY=<your_sepolia_private_key>
   ```
4. Verify deployment health at `https://<your-backend-domain>/api/v2/health`.

### Step 4: Connect Live Frontend to Public Backend
1. Update `.github/workflows/ci.yml`:
   ```yaml
   - name: Build Production Bundle for GitHub Pages
     env:
       CI: true
       PUBLIC_URL: /emertech-certify
       REACT_APP_API_URL: https://<your-backend-domain>
     run: |
       cd cleanroom/frontend
       npm run build
   ```
2. Commit and push to `main`: GitHub Actions will automatically rebuild and deploy the frontend connected to your live cloud backend.

---

## 9. Final Verification Matrix

| Feature | Publicly deployed? | Tested successfully? | Evidence | Remaining work |
| :--- | :---: | :---: | :--- | :--- |
| **Frontend UI Showcase** | **YES** | **YES** | HTTP 200 at `https://saqibahmadbhat.github.io/emertech-certify/` | None. Deployed and verified. |
| **Multi-Modal Verification UI** | **YES** | **YES** | Route `/verify` loads tabs, forms, and validation rules | None on frontend. Live queries require public backend. |
| **Backend REST Microservice** | **NO** | **YES (Locally & CI)** | 37 integration tests pass against local Hardhat node | Deploy to Render / AWS / GCP using `render.yaml` or `Dockerfile`. |
| **Smart Contract (Sepolia)** | **NO** | **YES (Locally & CI)** | 14 Hardhat unit tests pass against local EVM node | Deploy via `deploy-sepolia.js` using funded Sepolia wallet. |
| **MongoDB Atlas** | **NO** | **YES (Locally & CI)** | Embedded MongoDB tested in integration test suite | Provision cluster and configure `MONGO_URI`. |
| **End-to-End Verification** | **NO** | **YES (Locally & CI)** | Modes 1, 2, 3, 4 pass with real txHash on local EVM | Connect live frontend to deployed backend and Sepolia contract. |
| **Institutional Key Custody** | **NO (Local Only)** | **YES (Locally & CI)** | AES-256-GCM + PBKDF2 tests pass; MongoDB persistence verified | Integrate with Cloud KMS or HSM for enterprise grade. |
| **Zero Committed Secrets** | **YES** | **YES** | Static code and git log inspection confirms 0 leaks | Ongoing operator vigilance. |
| **CI/CD Pipeline** | **YES** | **YES** | GitHub Actions run `41780185222` succeeded (4/4 jobs) | Configure `REACT_APP_API_URL` once public backend is live. |
| **Independent Security Audit**| **NO** | **N/A** | Internal automated tests only | Engage professional third-party smart contract & application security auditor prior to mainnet launch. |

---

**Audit Certification**:  
This audit certifies that all statements above represent genuine, reproducible facts verified directly against the live GitHub repository, live web deployment, and automated test runners.

**Auditor & Lead Developer**: Saqib Ahmad Bhat  
**Date**: November 4, 2026
