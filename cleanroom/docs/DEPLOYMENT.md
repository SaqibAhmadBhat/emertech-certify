# Emertech Certify v2.0 — Production Cloud Deployment Guide

**Author**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**System**: AI-Assisted Blockchain-Based Academic Certificate Verification System  
**Implementation**: Primary Clean-Room Architecture (`cleanroom/`)  
**Production Frontend**: [`https://saqibahmadbhat.github.io/emertech-certify/`](https://saqibahmadbhat.github.io/emertech-certify/)  

---

## 1. High-Level Production Architecture

```
[ Tier 1: Client Verification Layer ]
  ├── React 19 Single Page Application (SPA)
  ├── GitHub Pages (Automated CI/CD Delivery) / Vercel / Netlify
  └── WebAssembly Tesseract.js Client Worker & Web Crypto API
          │
          ▼  (HTTPS / TLS 1.3 / REST API v2)
[ Tier 2: Application Microservice Layer ]
  ├── Node.js 20 & Express 4.18 REST Engine
  ├── Render / Railway / Managed Container VM (Docker)
  ├── PBKDF2/AES-256-GCM Institutional Key Custody (`KeyVaultService`)
  └── Rate Limiting, Security Headers & In-Memory Fallbacks
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

## 2. Multi-Platform Deployment Options

### Option A: GitHub Pages (Live Automated Frontend)
The frontend is pre-configured for automated continuous deployment via GitHub Actions:
- **Deployment URL**: `https://saqibahmadbhat.github.io/emertech-certify/`
- **Workflow**: `.github/workflows/ci.yml` (Job: `deploy-pages`)
- **Trigger**: Every push to `main` that successfully passes all 52 validation checks.
- **SPA Routing**: Handled via `public/404.html` and `public/index.html` URI redirect unpacking.

### Option B: Render Blueprint (`render.yaml`)
Deploy both the Express backend and React frontend with a single click using Render's Infrastructure-as-Code:
1. Fork or open the repository on [Render](https://render.com).
2. Click **New +** → **Blueprint**.
3. Select this repository: Render will detect [`render.yaml`](file:///Users/saqibahmadbhat/Desktop/Certiport-main/render.yaml).
4. Supply your `MONGO_URI` (MongoDB Atlas) in the environment settings.
5. Click **Apply**: Render automatically provisions:
   - `emertech-certify-backend` (Node Web Service with `/api/v2/health` health checks)
   - `emertech-certify-frontend` (Static Site with SPA rewrite rules)

### Option C: Containerized Docker Deployment (`docker-compose.yml`)
Run the full production stack on any Ubuntu/Debian cloud VM (AWS EC2, DigitalOcean Droplet, GCP Compute Engine):
```bash
# Clone the repository
git clone https://github.com/SaqibAhmadBhat/emertech-certify.git
cd emertech-certify

# Start all microservices (MongoDB, Backend, and Frontend)
docker compose up -d --build

# Verify running services
docker compose ps

# Inspect backend logs
docker compose logs -f backend
```
- Frontend UI: `http://localhost:3000`
- Backend REST API: `http://localhost:5001/api/v2/health`

---

## 3. Production Database: MongoDB Atlas Setup

Emertech Certify requires MongoDB for off-chain credential caching, institutional user management, audit logging, and encrypted key vault storage.

### Step 1: Create a Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster (M0) in your target region.

### Step 2: Configure Least-Privilege Database User
1. Navigate to **Database Access** → **Add New Database User**.
2. Authentication Method: **Password**.
3. Database User Privileges: `Read and write to any database` (restricted to database `emertech_certify`).
4. Generate a strong password (min 16 characters).

### Step 3: Network Security (IP Access List)
1. Navigate to **Network Access** → **Add IP Address**.
2. For cloud hosting providers with dynamic IPs (Render, Vercel, Railway), allow access from anywhere: `0.0.0.0/0`.
3. If running on a dedicated VM, restrict access to your VM's static public IP.

### Step 4: Connection String
Format the connection string for your `.env` configuration:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/emertech_certify?retryWrites=true&w=majority
```
> [!NOTE]
> Emertech Certify automatically sanitizes the connection string in server logs (`//***:***@`) to prevent credential leakage.

---

## 4. Blockchain Deployment: Ethereum Sepolia

For public decentralized verification, the smart contract `EmertechCertificateRegistry.sol` can be deployed to Ethereum Sepolia.

### Prerequisites
1. Dedicated deployment wallet private key (never use a personal mainnet key).
2. Sepolia testnet ETH from a public faucet (e.g. Google Cloud Web3 Sepolia Faucet or Infura Faucet).
3. Sepolia JSON-RPC URL (Alchemy, Infura, or public `https://rpc.sepolia.org`).

### Deployment Execution
```bash
# Set deployment environment variables
export SEPOLIA_RPC_URL="https://rpc.sepolia.org"
export SEPOLIA_PRIVATE_KEY="0x<your_testnet_private_key>"
export ETHERSCAN_API_KEY="<optional_etherscan_api_key>"

# Deploy to Sepolia testnet
cd cleanroom/contracts
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

### Deployment Output
The script automatically writes the deployed contract address, transaction hash, and block explorer URL to `cleanroom/contracts/deployments/sepolia.json`:
```json
{
  "address": "0x...",
  "network": "sepolia",
  "chainId": 11155111,
  "deployer": "0x...",
  "txHash": "0x...",
  "blockNumber": 1234567,
  "explorerUrl": "https://sepolia.etherscan.io/address/0x..."
}
```

Then configure the backend to anchor against Sepolia:
```env
BLOCKCHAIN_RPC_URL=https://rpc.sepolia.org
CONTRACT_ADDRESS=0x<deployed_sepolia_contract_address>
OFFCHAIN_DEMO=false
```

---

## 5. Environment Variables Specification

| Variable | Description | Required in Production | Default / Example | Sensitivity |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment mode | Yes | `production` | Public |
| `PORT` | HTTP server listening port | Yes | `5001` (or provider `$PORT`) | Public |
| `MONGO_URI` | MongoDB Atlas replica-set connection string | Yes | `mongodb+srv://...` | **Secret** |
| `JWT_SECRET` | Cryptographic secret for signing JWT bearer tokens | Yes (min 32 chars) | Random 64 hex chars | **Secret** |
| `KEY_VAULT_SECRET` | Master key for PBKDF2/AES-256-GCM key custody | Yes (min 32 chars) | Random 64 hex chars | **Secret** |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | Yes | `https://saqibahmadbhat.github.io` | Public |
| `BLOCKCHAIN_RPC_URL` | EVM JSON-RPC provider endpoint | Optional | `https://rpc.sepolia.org` | Semi-private |
| `CONTRACT_ADDRESS` | Deployed `EmertechCertificateRegistry` address | Optional | `0x...` | Public |
| `OFFCHAIN_DEMO` | Fallback mode when blockchain node is offline | No | `false` | Public |
| `PINATA_API_KEY` | Optional IPFS pinning API key | No | `""` | **Secret** |
| `PINATA_SECRET_KEY` | Optional IPFS pinning secret key | No | `""` | **Secret** |
| `REACT_APP_API_URL` | Frontend API client base URL | Yes (Frontend) | `https://api.yourdomain.com` | Public |

---

## 6. Health Checks & Production Verification

Once deployed, verify operational readiness:

### 1. Basic Health Check
```bash
curl -i https://<your_backend_domain>/api/v2/health
```
Expected HTTP 200 JSON Response:
```json
{
  "status": "ONLINE",
  "system": "Emertech Certify Clean-Room Backend",
  "version": "2.0.0",
  "developer": "Saqib Ahmad Bhat",
  "institution": "Government College of Engineering, Tirunelveli",
  "database": "CONNECTED",
  "environment": "production",
  "timestamp": "2026-11-04T10:00:00.000Z"
}
```

### 2. Readiness Probe
```bash
curl -i https://<your_backend_domain>/api/v2/health/ready
```
Expected HTTP 200 JSON Response:
```json
{
  "ready": true,
  "status": "READY"
}
```

---

## 7. Rollback & Redeployment Runbook

- **Frontend Rollback**:
  - In GitHub Pages / Actions: Re-run a previous successful workflow run or revert the commit on `main`.
  - In Vercel / Render: Navigate to **Deployments** → Select the previously working deployment → Click **Rollback**.
- **Backend Rollback**:
  - In Render / Railway: Select **Deployments** → Click **Rollback to this version**.
  - In Docker Compose: Re-tag previous image or deploy specific commit SHA:
    ```bash
    git checkout <previous_commit_sha>
    docker compose up -d --build
    ```
