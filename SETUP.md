# Emertech Certify — Setup and Execution Guide

**Project Title**: AI-Assisted Blockchain-Based Academic Certificate Verification System  
**Developer**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Target Environment**: macOS (MacBook Air / Apple Silicon), Linux, Windows  

---

## 1. Prerequisites

Before running the application, ensure the following software is installed:

- **Node.js**: Version 18.0.0 or higher (Tested on Node v22.23.3)
- **npm**: Version 9.0.0 or higher (Tested on npm 10.9.9)
- **Git**
- *Optional*: MongoDB daemon (If not installed, the application automatically uses an embedded in-memory MongoDB database).

> [!NOTE]
> **macOS Port 5000 Note**: On macOS Monterey, Ventura, Sonoma, and Sequoia, the native macOS `ControlCenter` (AirPlay Receiver) listens on port 5000 by default. Emertech Certify is specifically configured to run on **port 5001** to completely eliminate port collisions.

---

## 2. Quick-Start (3-Step Execution)

### Step 1: Install Dependencies

Run `npm install` across all three tiers:

```bash
# 1. Install contract dependencies
cd contracts
npm install

# 2. Install backend dependencies
cd ../backend
npm install

# 3. Install frontend dependencies
cd ../frontend/certiport-frontend
npm install --legacy-peer-deps

# Return to root directory
cd ../..
```

---

### Step 2: Smart Contract Setup & Compilation

You can compile contracts and execute unit tests locally:

```bash
cd contracts

# Run the 9 automated unit tests on the local EVM
npm test

# Deploy to in-memory Hardhat network
npx hardhat run scripts/deploy.js
```

#### To Run a Persistent Local Blockchain Node:

Open a dedicated terminal window:

```bash
cd contracts
npx hardhat node
```

In a second terminal, deploy the contract to this local node:

```bash
cd contracts
npm run deploy:localhost
```

The terminal will output the deployed contract address:
```
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

### Step 3: Start Backend & Frontend

#### Terminal 1 — Backend REST API:

```bash
cd backend
npm start
```
The server will initialize on port 5001 and output:
```
=================================================
🎓 Emertech Certify Backend running on port 5001
👨‍💻 Developer: Saqib Ahmad Bhat
🏛️ Institution: Government College of Engineering, Tirunelveli
🚀 Verification Engine & AI OCR Module Online
=================================================
```

#### Terminal 2 — React Frontend:

```bash
cd frontend/certiport-frontend
npm start
```
The application will open in your default browser at `http://localhost:3000`.

---

## 3. Automated Full-System Test

To run the complete automated test suite (all 9 smart contract tests and all 15 backend API and AI OCR tests) in a single command from the project root:

```bash
npm run test:all
```

---

## 4. Default Demonstration Accounts

The system comes pre-configured with credentials for easy academic evaluation:

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **System Administrator** | `admin@emertech.local` | `admin123` | Institutional approvals, global certificate audit, OCR testing |
| **University / Institution** | `vc@gce-tveli.edu.in` | `UniversitySecret123` | Certificate issuance, AI OCR autofill, template upload, revocation |
| **Student / Graduate** | `saqib.student@gce.edu.in` | `StudentSecurePassword123` | View issued certificates, download official PDFs, copy Blockchain ID |

---

## 5. Demonstration Walkthrough for Evaluation

1. **Visit Landing Page** (`http://localhost:3000`):
   - Notice the modern white/light layout with navy blue and purple accents.
   - Observe the quick verification search box and academic attribution footer.

2. **Log in as Administrator** (`/login`):
   - Click the "Admin Demo" pill and click "Sign In".
   - View live KPI metrics (Institutions, Students, Certificates, Revoked).
   - Test the "AI OCR Lab" tab by uploading any certificate image/PDF to watch the local OCR engine extract fields.

3. **Log in as Educational Institution** (`/login`):
   - Click "Institution Demo" and sign in.
   - Go to "Issue New Certificate".
   - Click **"Auto-Fill with AI OCR"** to upload a draft certificate, or enter student details manually.
   - Click **"Preview HTML Layout"** to inspect the rendered certificate.
   - Click **"Issue & Register Certificate"** to mint on-chain and save.
   - Download the generated PDF containing the embedded QR code.

4. **Public Multi-Modal Verification** (`/verify`):
   - **Mode 1 (ID Lookup)**: Paste the generated Blockchain ID to see the green AUTHENTIC badge and verified metadata.
   - **Mode 2 (PDF Upload)**: Drag and drop the downloaded PDF file. Notice the SHA-256 hash match confirmation.
   - **Mode 3 (Tamper Detection)**: Alter any text or byte in the PDF file and re-upload. Observe the immediate **TAMPERING DETECTED** red warning and hash mismatch display.

5. **Certificate Revocation**:
   - Return to the Institution Portal, find the certificate in "Issued Certificates", and click "Revoke" with a reason.
   - Verify the document again on `/verify` to see the updated **REVOKED** status and recorded explanation.

