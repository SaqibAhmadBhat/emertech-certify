const express = require('express');
const router = express.Router();
const { 
  getPendingRequests, 
  getApprovedUniversities, 
  approveUniversity, 
  rejectUniversity, 
  removeUniversity,
  getDashboardStats 
} = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, msg: 'Access denied. Admin only.' });
  }
};

// Apply authentication middleware to all routes
router.use(auth);
router.use(adminAuth);

router.get('/stats', getDashboardStats);
router.get('/pending-requests', getPendingRequests);
router.get('/universities', getApprovedUniversities);
router.put('/approve/:requestId', approveUniversity);
router.put('/reject/:requestId', rejectUniversity);
router.delete('/university/:universityId', removeUniversity);

module.exports = router;