const express = require('express');
const router = express.Router();
const multer = require('multer');
const VerifyController = require('../controllers/VerifyController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Mode 1: Hash direct query
router.post('/hash', VerifyController.verifyByHash);

// Mode 2: PDF file binary upload
router.post('/file', upload.any(), VerifyController.verifyByFile);

// Mode 3: QR code payload
router.post('/qr', VerifyController.verifyByQr);

// Mode 4: Scanned physical image OCR
router.post('/ocr', upload.single('imageFile'), VerifyController.verifyByOcr);

module.exports = router;
