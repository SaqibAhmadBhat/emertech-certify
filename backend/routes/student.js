const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your existing auth middleware
const {
  getStudentProfile,
  updateStudentProfile,
  getStudentCertificates,
  getCertificateDetails,
  downloadCertificate
} = require('../controllers/studentController');

// All routes require authentication
router.use(auth);

// @route   GET /api/student/profile
// @desc    Get student profile
// @access  Private (Student only)
router.get('/profile', getStudentProfile);

// @route   PUT /api/student/profile
// @desc    Update student profile
// @access  Private (Student only)
router.put('/profile', updateStudentProfile);

// @route   GET /api/student/certificates
// @desc    Get all certificates for the student
// @access  Private (Student only)
router.get('/certificates', getStudentCertificates);

// @route   GET /api/student/certificates/:certificateId
// @desc    Get specific certificate details
// @access  Private (Student only)
router.get('/certificates/:certificateId', getCertificateDetails);

// @route   GET /api/student/certificates/:certificateId/download
// @desc    Download certificate PDF
// @access  Private (Student only)
router.get('/certificates/:certificateId/download', downloadCertificate);

module.exports = router;