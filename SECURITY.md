# Emertech Certify — Security Policy & Vulnerability Audit Report

**Project Title**: AI-Assisted Blockchain-Based Academic Certificate Verification System  
**Developer**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Academic Context**: AI and Blockchain Engineer Intern Demonstration  

---

## 1. Upstream Vulnerabilities Disclosed & Remediated

During the initial technical audit of the open-source **Certiport** codebase, several high-severity security vulnerabilities were discovered. All of them have been thoroughly remediated in **Emertech Certify**:

### 1.1 🔴 CRITICAL: Plaintext Private Key Exposure in `contracts/getAddress.js`
- **Upstream Flaw**: A real 256-bit Ethereum private key was hardcoded in plain text directly in the upstream `contracts/getAddress.js`.
- **Remediation**: The hardcoded credential was completely eliminated from source code and documentation. The script was rewritten to read exclusively from `process.env.ETH_PRIVATE_KEY` with defensive error handling.
- **Compromise Notice**: The affected wallet must be considered permanently compromised. Any accounts, testnet funds, or contracts associated with that upstream address cannot be trusted in production.

### 1.2 🔴 CRITICAL: Plaintext Admin Password Console Logging in `authController.js`
- **Upstream Flaw**: Lines 173-174 of `backend/controllers/authController.js` dumped the administrator password directly into stdout (`console.log('Admin password from env:', process.env.ADMIN_PASSWORD)`), leaking it to server log files and process supervisors on every login attempt.
- **Remediation**: All sensitive credential logging was eliminated.

### 1.3 🔴 CRITICAL: Unauthenticated Template Upload & SSTI Risk
- **Upstream Flaw**: `backend/routes/template.js` exposed `/api/template/upload` without JWT authentication middleware, allowing anonymous users to upload executable EJS templates (Server-Side Template Injection / RCE risk).
- **Remediation**: The insecure standalone template route was removed. Template authoring is strictly restricted to authenticated and approved institutions with JWT verification.

### 1.4 🔴 HIGH: Unprotected Client-Side Routes in React SPA
- **Upstream Flaw**: The original `App.js` mounted `/admin`, `/university`, and `/student` without route guards.
- **Remediation**: Implemented a comprehensive `ProtectedRoute` component enforcing role verification and redirecting unauthenticated visitors to `/login`.

### 1.5 🟡 MEDIUM: Wildcard CORS Configuration
- **Upstream Flaw**: The backend used permissive `cors()` with no origin restrictions.
- **Remediation**: Configured CORS with explicit allowed origins (`http://localhost:3000`, `FRONTEND_URL`) and credentials support.

---

## 2. Platform Security Architecture

### 2.1 Password Security & Storage
- Passwords are never stored in plain text.
- User passwords are automatically salted and hashed using **Bcrypt** with 10 salt rounds (`bcrypt.hash(password, 10)`).

### 2.2 JWT Authentication
- State-less authorization via JSON Web Tokens.
- Tokens are signed with `process.env.JWT_SECRET` and set to expire within 24 hours.

### 2.3 Smart Contract Access Controls
- The `CertificateRegistry.sol` contract enforces `onlyAuthorized` on the `issueCertificate` function.
- Only registered institutions authorized by the contract owner can mint certificates.
- Revocation (`revokeCertificate`) is strictly restricted to the original issuer or the contract owner.

### 2.4 Privacy & Data Minimization on Public Verifier
- The public verification portal only exposes non-sensitive academic credentials (Student Name, Institution, Degree Title, Semester, Issue Date, and SHA-256 Digest).
- Confidential personal details (Date of Birth, personal phone number, home address) are strictly filtered out in `publicController.sanitizePublicCertificate`.

---

## 3. Environment Variable Security Best Practices

1. Never commit `.env` files to Git. The project `.gitignore` explicitly excludes all `.env` files while preserving safe `.env.example` templates.
2. For production deployments, manage secrets via encrypted secret managers (e.g. AWS Secrets Manager, Doppler, or GitHub Secrets).
3. Use a unique `JWT_SECRET` with at least 256 bits of entropy.

