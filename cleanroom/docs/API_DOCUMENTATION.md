# Emertech Certify — REST API v2 Specification (Clean-Room)

**Version**: 2.0.0-CLEANROOM  
**Base URL**: `http://localhost:5001/api/v2`  
**Authentication**: Bearer Token (`Authorization: Bearer <JWT>`)  

---

## 1. System Health

### `GET /health`
Returns system operational state, version, and developer metadata.
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "status": "ONLINE",
    "system": "Emertech Certify Clean-Room Backend",
    "version": "2.0.0",
    "developer": "Saqib Ahmad Bhat",
    "institution": "Government College of Engineering, Tirunelveli",
    "timestamp": "2026-11-04T00:00:00.000Z"
  }
  ```

---

## 2. Authentication (`/auth`)

### `POST /auth/register`
Public registration endpoint. **Restricted to least-privilege `STUDENT` accounts only.**  
Any attempt to supply `role: "SUPER_ADMIN"` or `role: "INSTITUTION_ADMIN"` is strictly rejected with HTTP 403 Forbidden.
- **Access**: Public
- **Body**:
  ```json
  {
    "fullName": "Jane H. Doe",
    "email": "jane.doe@apex.edu.test",
    "password": "StudentPassword2026!",
    "studentIdentifier": "STU-2026-0042"
  }
  ```
- **Response `201 Created`**: Returns student user profile and JWT token.
- **Error `403 Forbidden`**: Returned if administrative roles are requested.

### `POST /auth/login`
Authenticates credentials with bcrypt.
- **Body**: `{ "email": "...", "password": "..." }`
- **Response `200 OK`**: Returns user profile and session token.

### `GET /auth/me`
Retrieves currently authenticated session.
- **Access**: Protected (`Bearer <JWT>`)

---

## 3. Academic Institutions (`/institutions`)

### `POST /institutions/apply`
Public onboarding endpoint for universities to apply for accreditation.
- **Body**: `{ "institutionCode", "name", "officialDomain", "contactEmail", "walletAddress" }`

### `POST /institutions/issue`
Issues a single academic certificate, computes deterministic SHA-256 hash, generates vector PDF, and commits hash to Ethereum blockchain with the institution's authorized signer.
- **Access**: `INSTITUTION_ADMIN` (Strictly scoped to caller's `institutionCode`)
- **Body**:
  ```json
  {
    "studentName": "Jane H. Doe",
    "studentIdentifier": "STU-2026-0042",
    "degreeTitle": "Bachelor of Science",
    "majorProgram": "Computer Engineering",
    "graduationDate": "2026-05-15",
    "gradeOrDistinction": "First Class with Distinction"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "certificate": {
      "certificateId": "AIT-MW12TMRV-0042",
      "certHash": "0x2bcbb824b9229e3ff797cde69569910f9d00cdfc5178f3fedb15edfe0003ab28",
      "studentName": "Jane H. Doe",
      "degreeTitle": "Bachelor of Science",
      "txHash": "0xbada9e23ca933be21394563ea6a94c7f457f9ff828e9e96e307684e8b8c96f1a",
      "onChain": true,
      "issuerWallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "onChainIssuer": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    }
  }
  ```

### `POST /institutions/batch`
Batch issuance for multiple graduates simultaneously with on-chain registration.
- **Access**: `INSTITUTION_ADMIN`
- **Body**: `{ "batch": [ { "studentName", "studentIdentifier", ... } ] }`

### `POST /institutions/revoke`
Revokes an existing credential on the Ethereum smart contract. Multi-tenant checks prevent an institution from revoking degrees issued by another institution.
- **Access**: `INSTITUTION_ADMIN`
- **Body**: `{ "certHash": "0x...", "reason": "Degree classification updated" }`

### `GET /institutions/certificates`
Lists certificates issued by the authenticated institution.
- **Access**: `INSTITUTION_ADMIN`

---

## 4. Multi-Modal Verification (`/verify`)

### `POST /verify/hash`
Direct lookup by 64-character hexadecimal SHA-256 hash.
- **Access**: Public
- **Body**: `{ "hash": "0x..." }`
- **Response `200 OK`**: Returns verification status (`AUTHENTIC`, `REVOKED`, `OFFCHAIN_DEMO`, `NOT_FOUND`), verified on-chain issuer address, and full academic metadata.

### `POST /verify/file`
Uploads original PDF file for bitwise verification and tamper detection. Enforces `%PDF-` magic byte validation.
- **Access**: Public
- **Multipart Form**: `certificatePdf` (binary PDF)
- **Response `200 OK`**:
  - `status`: `"AUTHENTIC"` (Bitwise match against on-chain hash)
  - `status`: `"TAMPER_DETECTED"` (Bitwise mismatch detected; flags alteration)

### `POST /verify/qr`
Decodes QR code verification URL string.
- **Access**: Public
- **Body**: `{ "qrPayload": "http://localhost:3000/verify?hash=0x..." }`

### `POST /verify/ocr`
Extracts academic text and entities from a scanned document image using Tesseract.js. Enforces PNG/JPEG magic byte validation.
- **Access**: Public
- **Multipart Form**: `imageFile` (PNG/JPEG)
- **Response `200 OK`**: Returns extracted text and parsed student metadata.

---

## 5. Certificate Retrieval (`/certificates`)

### `GET /certificates/:id`
Retrieves public certificate details by ID or hash.

### `GET /certificates/:id/pdf`
Streams the official vector PDF degree certificate for download.

### `GET /certificates/student/my-certificates`
Returns all credentials issued to the currently authenticated student.
- **Access**: `STUDENT`

---

## 6. Governance Administration (`/admin`)

### `GET /admin/institutions`
Lists all registered institutions and their on-chain accreditation status.
- **Access**: `SUPER_ADMIN`

### `PATCH /admin/institutions/:id/status`
Updates institutional status (`AUTHORIZED`, `SUSPENDED`, `REVOKED`) on the Ethereum smart contract with mined receipts.
- **Access**: `SUPER_ADMIN`
- **Body**: `{ "status": "AUTHORIZED" }`

### `POST /admin/institutions/:id/provision-admin`
Provisions an Institution Administrator account for an already accredited institution (`onChainAuthorized: true`).
- **Access**: `SUPER_ADMIN`
- **Body**:
  ```json
  {
    "fullName": "Dean of Academic Records",
    "email": "dean.records@apex.edu.test",
    "password": "DeanSecurePassword2026!"
  }
  ```
- **Response `201 Created`**: Returns provisioned admin record bound to the target institution's code and wallet.

### `GET /admin/telemetry`
Aggregates network-wide credential metrics and security audit logs.
- **Access**: `SUPER_ADMIN`
