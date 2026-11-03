# Emertech Certify — Local Setup & Execution Guide (Clean-Room v2.0)

**Developer**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  

---

## 1. Prerequisites

- **Node.js**: `>= 18.0.0` (Recommended: Node.js 20.x or 22.x LTS)
- **npm**: `>= 9.0.0`
- **Git**

---

## 2. Fast Setup (Zero Configuration)

Emertech Certify includes an automated embedded database fallback and a built-in cryptographic simulation mode. No external database or blockchain software is required to test the full system.

```bash
# 1. Navigate to cleanroom directory
cd cleanroom

# 2. Run the complete automated test suite
npm run test:all
```

---

## 3. Running the Complete Application Locally

### Step 1: Start Smart Contracts (Optional: Local Hardhat Node)
```bash
# Terminal 1
cd cleanroom/contracts
npx hardhat node
```

### Step 2: Start Backend REST API
```bash
# Terminal 2
cd cleanroom/backend
node src/server.js
```
The backend initializes automatically on **port 5001** and starts the embedded database server.

### Step 3: Start React Frontend
```bash
# Terminal 3
cd cleanroom/frontend
npm start
```
Your browser will open automatically at **`http://localhost:3000`**.

---

## 4. Environment Variables Reference

| Variable | Default Value | Purpose |
|---|---|---|
| `PORT` | `5001` | Express server port (avoiding macOS port 5000 AirPlay conflict) |
| `NODE_ENV` | `development` | Runtime environment mode |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/emertech_certify_cleanroom` | MongoDB URI (auto in-memory fallback if unreachable) |
| `JWT_SECRET` | Pre-configured secure key | HMAC secret for signing session tokens |
| `JWT_EXPIRES_IN` | `24h` | Token validity duration |
| `BLOCKCHAIN_RPC_URL` | `http://127.0.0.1:8545` | Ethereum node RPC endpoint |
| `CONTRACT_ADDRESS` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Deployed `EmertechCertificateRegistry` address |
| `DEPLOYER_PRIVATE_KEY` | Hardhat default key (0xac09...) | Local signer private key for testing |
