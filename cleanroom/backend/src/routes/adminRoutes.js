const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/institutions', AdminController.listInstitutions);
router.patch('/institutions/:id/status', AdminController.setInstitutionStatus);
router.post('/institutions/:id/provision-admin', AdminController.provisionInstitutionAdmin);
router.get('/telemetry', AdminController.getTelemetry);

module.exports = router;
