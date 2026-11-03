const express = require('express');
const router = express.Router();
const InstitutionController = require('../controllers/InstitutionController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// Public application endpoint
router.post('/apply', InstitutionController.apply);

// Protected institution routes
router.post(
  '/issue',
  authenticateToken,
  requireRoles('INSTITUTION_ADMIN', 'SUPER_ADMIN'),
  InstitutionController.issueCertificate
);

router.post(
  '/batch',
  authenticateToken,
  requireRoles('INSTITUTION_ADMIN', 'SUPER_ADMIN'),
  InstitutionController.batchIssueCertificates
);

router.post(
  '/revoke',
  authenticateToken,
  requireRoles('INSTITUTION_ADMIN', 'SUPER_ADMIN'),
  InstitutionController.revokeCertificate
);

router.get(
  '/certificates',
  authenticateToken,
  requireRoles('INSTITUTION_ADMIN', 'SUPER_ADMIN'),
  InstitutionController.listCertificates
);

router.post(
  '/enrollments',
  authenticateToken,
  requireRoles('INSTITUTION_ADMIN', 'SUPER_ADMIN'),
  InstitutionController.createEnrollment
);

router.post(
  '/key-custody',
  authenticateToken,
  requireRoles('INSTITUTION_ADMIN', 'SUPER_ADMIN'),
  InstitutionController.setupKeyCustody
);

module.exports = router;
