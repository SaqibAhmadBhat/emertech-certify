const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const publicController = require('../controllers/publicController');

const tempDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `verify-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// 1. Get approved universities
router.get('/approved-universities', publicController.getApprovedUniversities);

// 2. Verify by Certificate ID (GET)
router.get('/verify/:blockchainId', publicController.verifyCertificate);

// 3. Verify by PDF Upload (POST multipart)
router.post('/verify/pdf', upload.single('certificate'), publicController.verifyCertificateByPdf);

// 4. Verify by QR code image or payload (POST)
router.post('/verify/qr', upload.single('qrImage'), publicController.verifyCertificateByQr);

// 5. Download Certificate PDF
router.get('/certificate/:blockchainId/download', publicController.downloadCertificate);

module.exports = router;
