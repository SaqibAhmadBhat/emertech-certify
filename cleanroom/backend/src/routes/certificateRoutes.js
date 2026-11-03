const express = require('express');
const router = express.Router();
const CertificateController = require('../controllers/CertificateController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// Student profile certificates
router.get(
  '/student/my-certificates',
  authenticateToken,
  requireRoles('STUDENT', 'SUPER_ADMIN'),
  CertificateController.getStudentCertificates
);

// Public certificate inspection
router.get('/:id', CertificateController.getCertificateById);

// Public PDF download
router.get('/:id/pdf', CertificateController.downloadPdf);

module.exports = router;
