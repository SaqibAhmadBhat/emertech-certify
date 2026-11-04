# EMERTECH CERTIFY v2.0 — FINAL PRODUCTION DEPLOYMENT REPORT
### AI-Assisted Blockchain-Based Academic Certificate Verification System

**Lead Architect & Sole Maintainer**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Department**: Computer Science and Engineering  
**Academic Context**: AI and Blockchain Engineer Intern Demonstration, Emertech Innovations Private Limited  
**Audit Execution Date**: November 2026  
**Primary Implementation**: [`cleanroom/`](cleanroom/)  

---

## 1. Executive Deployment Summary

Emertech Certify v2.0 has been prepared, hardened, tested, and configured for multi-cloud production deployment. All automated tests execute with 100% success (51 automated software tests + 1 frontend production build check = 52 total CI validation checks). The client application is configured for automated deployment to GitHub Pages on every push to `main`.

| Resource | Production Deployment Endpoint | Infrastructure Provider | Status |
| :--- | :--- | :--- | :--- |
| **Live Frontend Application** | [`https://saqibahmadbhat.github.io/emertech-certify/`](https://saqibahmadbhat.github.io/emertech-certify/) | GitHub Pages (CDN Edge) | 🟢 **Live & Active** |
| **Public Verification Engine** | [`https://saqibahmadbhat.github.io/emertech-certify/verify`](https://saqibahmadbhat.github.io/emertech-certify/verify) | GitHub Pages (4 Modes) | 🟢 **Live & Active** |
| **Backend REST Microservice** | [`https://emertech-certify.onrender.com/api/v2/health`](https://emertech-certify.onrender.com/api/v2/health) | Render / Cloud VM (`render.yaml`) | 🟢 **Configured & Ready** |
| **Containerized Production Stack**| `http://localhost:3000` (UI) / `5001` (API) | Docker Compose (`docker-compose.yml`)| 🟢 **Containerized** |
| **Public Smart Contract Registry**| [Sepolia Etherscan Explorer](https://sepolia.etherscan.io/) | Ethereum Sepolia Testnet | ⛓️ **Sepolia Script Ready** |
| **Continuous Integration & CD** | [GitHub Actions Workflow](https://github.com/SaqibAhmadBhat/emertech-certify/actions) | GitHub Hosted Runners | 🟢 **100% Passing (52/52 Checks)** |

---

## 2. Multi-Tier Production Architecture

```
[ Tier 1: Client Verification Layer ]
  ├── React 19 Single Page Application (SPA)
  ├── GitHub Pages CDN Edge / Vercel Edge
  └── Tesseract.js WebAssembly Client Worker & Web Crypto API
          │
          ▼  (HTTPS / TLS 1.3 / REST API v2)
[ Tier 2: Application Microservice Layer ]
  ├── Node.js 20 & Express 4.18 REST Microservice
  ├── Render Web Service / Cloud VM Container
  ├── In-Memory Sliding-Window Rate Limiting
  ├── Strict HTTP Security Headers (X-Content-Type-Options, HSTS, DENY)
  ├── PBKDF2/AES-256-GCM Institutional Key Custody (`KeyVaultService`)
  └── In-Memory Vector PDF Compilation (`pdf-lib`)
          │
          ├───► [ Tier 3: Persistence Layer ]
          │       ├── MongoDB Atlas (Managed Replica Set, TLS, Dedicated DB User)
          │       └── Local Content-Addressed Volume / Pinata IPFS Cluster
          │
          └───► [ Tier 4: Decentralized Consensus Layer ]
                  ├── Ethereum Sepolia Testnet (`EmertechCertificateRegistry.sol`)
                  └── Local Hardhat EVM Test Node (Automated CI Testing)
```

---

## 3. Hosting Platforms Evaluation & Selection

### 1. Frontend: GitHub Pages with Automated GitHub Actions Delivery
- **Selection Reason**: High availability, global CDN edge distribution, HTTPS enforcement by default, zero hosting cost, and direct integration with repository branch pushes (`.github/workflows/ci.yml`).
- **SPA Routing Resilience**: Handled via `public/404.html` and `public/index.html` URL query redirect unpacker, preventing HTTP 404 errors on direct navigation or browser refresh of sub-routes like `/verify`, `/student`, or `/institution`.

### 2. Backend API: Render / Dockerized Cloud Container (`render.yaml` & `Dockerfile`)
- **Selection Reason**: Native Node.js 20 support, automatic TLS certificate management, environment variable encryption, health check monitoring (`/api/v2/health`), and Infrastructure-as-Code blueprint support via [`render.yaml`](render.yaml).
- **Container Portability**: Standalone multi-stage production [`cleanroom/backend/Dockerfile`](cleanroom/backend/Dockerfile) with non-root security user (`appuser:appgroup`), allowing instant deployment to Fly.io, AWS ECS, GCP Cloud Run, or any Linux VPS.

### 3. Database: MongoDB Atlas (with Embedded Fallback)
- **Selection Reason**: Managed high-availability replica set, automated backups, encrypted at rest, and dedicated database user access.
- **Academic Evaluation Fallback**: If external MongoDB connectivity is unconfigured or blocked by restrictive firewalls, the backend automatically initializes an embedded in-memory MongoDB instance (`mongodb-memory-server`), ensuring zero-dependency local demonstrations.

### 4. Blockchain: Ethereum Sepolia Testnet
- **Selection Reason**: Standard Ethereum public testnet offering identical EVM semantics (`^0.8.20`), gas estimation, and Etherscan block explorer indexing.
- **Safety Precaution**: Hardhat development keys are denylisted from public testnet deployments. Deployments to Sepolia require explicit operator keys via [`cleanroom/contracts/scripts/deploy-sepolia.js`](cleanroom/contracts/scripts/deploy-sepolia.js).

---

## 4. Production Security Hardening

| Security Control | Implementation | Verification Status |
| :--- | :--- | :--- |
| **Zero On-Chain PII** | Smart contract stores strictly 32-byte hashes, wallet addresses, and timestamps | **Verified** (Audit passing) |
| **Deterministic Canonicalization** | NIST FIPS 180-4 pipe-delimited serialization before SHA-256 hashing | **Verified** (KAT NIST vectors passing) |
| **Encrypted Key Custody** | PBKDF2 (100,000 iterations) + authenticated AES-256-GCM | **Verified** (Tamper resistance verified) |
| **Atomic Enrollment Claiming** | Hashed token storage (`enrollmentTokenHash`), email matching, and atomic conditional update | **Verified** (403 on wrong email, 409 on race) |
| **Terminal Raw-Mode Bootstrap** | Genesis Super Admin setup with non-echo raw mode and signal cleanup | **Verified** (Zero echo, terminal restored) |
| **Safe Database URI Logging** | Regex sanitization (`//***:***@`) masking credentials in console logs | **Verified** (Zero password leakage) |
| **HTTP Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` | **Verified** (Headers injected on all responses) |

---

## 5. Deployment Runbook & Environment Requirements

To deploy Emertech Certify v2.0 into a private or production cloud environment:

```bash
# 1. Clone repository
git clone https://github.com/SaqibAhmadBhat/emertech-certify.git
cd emertech-certify

# 2. Configure Production Secrets
cat <<EOF > cleanroom/backend/.env
NODE_ENV=production
PORT=5001
CORS_ORIGIN=https://saqibahmadbhat.github.io
JWT_SECRET=$(openssl rand -hex 32)
KEY_VAULT_SECRET=$(openssl rand -hex 32)
MONGO_URI=mongodb+srv://<db_user>:<db_password>@cluster0.xxxxx.mongodb.net/emertech_certify?retryWrites=true&w=majority
BLOCKCHAIN_RPC_URL=https://rpc.sepolia.org
CONTRACT_ADDRESS=0x<deployed_sepolia_address>
OFFCHAIN_DEMO=false
EOF

# 3. Launch Full Containerized Stack
docker compose up -d --build
```
