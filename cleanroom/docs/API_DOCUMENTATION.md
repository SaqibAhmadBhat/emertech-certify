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
    "institution": "Government College of Engineering, Tirunelveli"
  }
  ```

---

## 2. Authentication (`/auth`)

### `POST /auth/register`
Creates a user account (`STUDENT` or `INSTITUTION_ADMIN`).
- **Body**: `{ "fullName", "email", "password", "role", "institutionCode", "studentIdentifier" }`
- **Response `201 Created`**: Returns user profile and JWT token.

### `POST /auth/login`
Authenticates credentials with bcrypt.
- **Body**: `{ "email", "password" }`
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
Issues a single academic certificate, computes deterministic SHA-256 hash, generates vector PDF, and commits hash to Ethereum blockchain.
- **Access**: `INSTITUTION_ADMIN`
- **Body**:
  ```json
  {
    "studentName": "Saqib Ahmad Bhat",
    "studentIdentifier": "950020104001",
    "degreeTitle": "Bachelor of Engineering",
    "majorProgram": "Computer Science and Engineering",
    "graduationDate": "2026-05-15",
    "gradeOrDistinction": "First Class with Distinction"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "certificate": {
      "certificateId": "GCE-MW0YFEJG-4001",
      "certHash": "0x1f97927101a158f91358996c37fa771adc706809f0a4b2280869ecd0735ce3e8",
      "studentName": "Saqib Ahmad Bhat",
      "degreeTitle": "Bachelor of Engineering",
      "txHash": "0x..."
    }
  }
  ```

### `POST /institutions/batch`
Batch issuance for multiple graduates simultaneously.
- **Access**: `INSTITUTION_ADMIN`
- **Body**: `{ "batch": [ { "studentName", "studentIdentifier", ... } ] }`

### `POST /institutions/revoke`
Revokes an existing credential on the Ethereum smart contract.
- **Access**: `INSTITUTION_ADMIN`
- **Body**: `{ "certHash": "0x...", "reason": "Administrative correction" }`

---

## 4. Multi-Modal Verification (`/verify`)

### `POST /verify/hash`
Direct lookup by 64-character hexadecimal SHA-256 hash.
- **Access**: Public
- **Body**: `{ "hash": "0x..." }`
- **Response `200 OK`**: Returns verification status (`AUTHENTIC`, `REVOKED`, `NOT_FOUND`) and diagnostics.

### `POST /verify/file`
Uploads original PDF file for bitwise verification and tamper detection.
- **Access**: Public
- **Multipart Form**: `certificateFile` (binary PDF)
- **Response `200 OK`**:
  - `status`: `"AUTHENTIC"` (Bitwise match)
  - `status`: `"TAMPER_DETECTED"` (Bitwise mismatch detected; shows computed vs expected hash)

### `POST /verify/qr`
Decodes QR code verification URL string.
- **Access**: Public
- **Body**: `{ "qrPayload": "http://localhost:3000/verify?hash=0x..." }`

### `POST /verify/ocr`
Extracts academic text and entities from a scanned document image using Tesseract.js.
- **Access**: Public
- **Multipart Form**: `imageFile` (PNG/JPG)
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
