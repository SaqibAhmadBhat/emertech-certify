# Emertech Certify — REST API Specification

**Project**: Emertech Certify (Academic Certificate Verification System)  
**Developer**: Saqib Ahmad Bhat  
**Institution**: Government College of Engineering, Tirunelveli  
**Base URL**: `http://localhost:5001/api`  
**Authentication**: Bearer Token in `Authorization` header (`Bearer <jwt_token>`)  

---

## 1. System Health

### `GET /health`
Returns system operational status, developer attribution, and current server time.
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "status": "online",
  "project": "Emertech Certify",
  "developer": "Saqib Ahmad Bhat",
  "institution": "Government College of Engineering, Tirunelveli",
  "timestamp": "2026-11-03T15:20:00.000Z"
}
```

---

## 2. Authentication & Authorization

### `POST /auth/register`
Registers a new student account or queues an institution application.
- **Access**: Public
- **Request Body (Student)**:
```json
{
  "role": "student",
  "email": "saqib.student@gce.edu.in",
  "password": "SecurePassword123",
  "fullName": "Saqib Ahmad Bhat",
  "dateOfBirth": "2003-05-15",
  "program": "ug",
  "enrollmentNumber": "950020104001",
  "universityName": "Government College of Engineering, Tirunelveli",
  "yearOfAdmission": 2022,
  "yearOfGraduation": 2026
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "msg": "Student account registered successfully! You may now sign in.",
  "canLogin": true
}
```

### `POST /auth/login`
Authenticates administrators, institutions, and students.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@emertech.local",
  "password": "admin123"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin",
    "email": "admin@emertech.local",
    "name": "System Administrator",
    "role": "admin"
  }
}
```

---

## 3. Administrative Console (`/admin`)

### `GET /admin/stats`
Returns global counts for institutions, students, authentic certificates, and pending requests.
- **Access**: Admin only (`Authorization: Bearer <admin_token>`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "stats": {
    "totalUniversities": 4,
    "totalStudents": 28,
    "totalCertificates": 12,
    "totalRevoked": 1,
    "pendingRequests": 2
  }
}
```

### `GET /admin/pending-requests`
Lists all institution applications pending review.
- **Access**: Admin only
- **Response `200 OK`**:
```json
{
  "success": true,
  "requests": [
    {
      "_id": "673f1...",
      "email": "vc@university.edu.in",
      "universityDetails": {
        "universityName": "State Engineering University",
        "accreditationId": "NAAC-A-PLUS",
        "contactPersonName": "Dr. Registrar"
      },
      "status": "pending"
    }
  ]
}
```

### `PUT /admin/approve/:requestId`
Approves an institution application, generates a unique ID (`un01`), and activates issuance permissions.
- **Access**: Admin only

### `PUT /admin/reject/:requestId`
Rejects an institution application with an explanation.
- **Access**: Admin only
- **Request Body**: `{ "reason": "Accreditation documentation incomplete" }`

---

## 4. Institution Operations (`/university`)

### `GET /university/templates`
Retrieves all active certificate layouts provisioned for the institution.
- **Access**: University / Admin
- **Response `200 OK`**:
```json
{
  "success": true,
  "templates": [
    {
      "_id": "673f2...",
      "templateName": "Semester Marks Card",
      "certificateType": "marks_card",
      "templatePath": "templates/un03/marks_card.ejs"
    }
  ]
}
```

### `POST /university/certificate/issue`
Issues an academic certificate, generates a QR code, renders an A4 PDF, computes its SHA-256 digest, and mints on-chain.
- **Access**: University / Admin
- **Request Body**:
```json
{
  "templateId": "673f2...",
  "studentEmail": "saqib.student@gce.edu.in",
  "certificateData": {
    "studentName": "Saqib Ahmad Bhat",
    "registerNo": "950020104001",
    "course": "B.E. Computer Science and Engineering",
    "program": "Undergraduate",
    "semester": "VIII",
    "examDate": "May 2026",
    "yearOfGraduation": 2026,
    "subjects": [
      { "name": "Blockchain & Smart Contracts", "maxMarks": "100", "obtainedMarks": "98", "grade": "O" }
    ]
  }
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "msg": "Academic certificate issued and registered successfully",
  "certificate": {
    "blockchainId": "UN01-CERT-868OYM-20261103",
    "documentHash": "0xb2a1d7732282e329dd1a2412c0960a7aa95952ac...",
    "ipfsHash": "local-ipfs-b2a1d7732282e329dd1a2412c0960a7a",
    "storageType": "local",
    "verifiedOnChain": true,
    "pdfUrl": "/api/public/certificate/UN01-CERT-868OYM-20261103/download"
  }
}
```

### `DELETE /university/certificate/:certificateId`
Revokes an issued certificate both in the database and on the Ethereum smart contract.
- **Access**: University / Admin
- **Request Body**: `{ "reason": "Administrative correction" }`

---

## 5. Public Multi-Modal Verification (`/public`)

### `GET /public/verify/:blockchainId`
Verifies certificate validity using its unique Certificate ID.
- **Access**: Public
- **Response `200 OK` (Authentic)**:
```json
{
  "success": true,
  "valid": true,
  "status": "AUTHENTIC",
  "msg": "VERIFIED AUTHENTIC: Certificate record is valid and registered in the academic verification system.",
  "certificate": {
    "blockchainId": "UN01-CERT-868OYM-20261103",
    "studentName": "Saqib Ahmad Bhat",
    "universityName": "Government College of Engineering, Tirunelveli",
    "course": "B.E. Computer Science and Engineering",
    "documentHash": "0xb2a1d7732282e329dd1a2412c0960a7aa95952ac...",
    "status": "issued"
  }
}
```

### `POST /public/verify/pdf`
Accepts an uploaded certificate PDF file (`multipart/form-data`), computes its SHA-256 cryptographic digest, and validates it against the smart contract registry.
- **Access**: Public
- **Form Data**: `certificate` (File, required), `blockchainId` (Text, optional)
- **Response `200 OK`**:
  - `status: "AUTHENTIC"` — Document hash matches on-chain record.
  - `status: "TAMPERED"` — Hash mismatch (document has been altered).
  - `status: "REVOKED"` — Matching document is officially revoked.

### `POST /public/verify/qr`
Decodes an uploaded QR image or payload and verifies the embedded certificate ID.
- **Access**: Public

### `GET /public/certificate/:blockchainId/download`
Streams the original generated PDF certificate for download.
- **Access**: Public

---

## 6. AI-Assisted Document Extraction (`/ai`)

### `POST /ai/extract-ocr`
Executes local neural OCR (Tesseract.js) and PDF stream parsing to extract certificate text and candidate fields (Name, Register No, Degree, Date).
- **Access**: Authenticated (Admin / University)
- **Form Data**: `document` (PDF or image file)
- **Response `200 OK`**:
```json
{
  "success": true,
  "extractionMethod": "PDF Text Stream Parser",
  "fields": {
    "studentName": "Saqib Ahmad Bhat",
    "institutionName": "Government College of Engineering, Tirunelveli",
    "registerNo": "950020104001",
    "course": "B.E. Computer Science and Engineering",
    "issueDate": "2026-05-20"
  },
  "disclaimer": "OCR-assisted extraction provides suggestions for administrative convenience. Authorized personnel must verify all values prior to final certificate issuance."
}
```

