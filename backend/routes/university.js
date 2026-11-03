const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { 
  getUniversityProfile,
  uploadTemplate,
  getTemplates,
  issueCertificate,
  getIssuedCertificates,
  revokeCertificate,
  previewCertificate
} = require('../controllers/universityController');

// Multer storage for template uploads
const tempDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const templateStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, tempDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const templateUpload = multer({ 
  storage: templateStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    const allowedTypes = ['.ejs', '.html', '.htm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .ejs and .html files are allowed'));
    }
  }
});

// Routes
router.get('/profile', auth, getUniversityProfile);
router.post('/template/upload', auth, templateUpload.single('templateFile'), uploadTemplate);
router.get('/templates', auth, getTemplates);
router.post('/certificate/issue', auth, issueCertificate);
router.post('/certificate/preview', auth, previewCertificate);
router.get('/certificates', auth, getIssuedCertificates);

// Revocation endpoints (supporting DELETE, PUT, and POST for frontend flexibility)
router.delete('/certificate/:certificateId', auth, revokeCertificate);
router.put('/certificate/revoke/:certificateId', auth, revokeCertificate);
router.post('/certificate/revoke/:certificateId', auth, revokeCertificate);

module.exports = router;
