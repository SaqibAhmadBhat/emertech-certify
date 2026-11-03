const Institution = require('../models/Institution');
const Certificate = require('../models/Certificate');
const AuditLog = require('../models/AuditLog');
const BlockchainService = require('../services/BlockchainService');

class AdminController {
  static async listInstitutions(req, res, next) {
    try {
      const institutions = await Institution.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, count: institutions.length, institutions });
    } catch (err) {
      next(err);
    }
  }

  static async setInstitutionStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['PENDING', 'AUTHORIZED', 'SUSPENDED', 'REVOKED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid institution status.' });
      }

      const institution = await Institution.findById(id);
      if (!institution) {
        return res.status(404).json({ success: false, message: 'Institution not found.' });
      }

      institution.status = status;
      if (status === 'AUTHORIZED') {
        institution.approvedAt = new Date();
        institution.approvedByAdmin = req.user._id;

        // Authorize on smart contract
        await BlockchainService.authorizeInstitution(
          institution.walletAddress,
          institution.name,
          institution.officialDomain
        );
      }
      await institution.save();

      res.status(200).json({
        success: true,
        message: `Institution status updated to ${status}.`,
        institution
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTelemetry(req, res, next) {
    try {
      const totalInstitutions = await Institution.countDocuments();
      const authorizedInstitutions = await Institution.countDocuments({ status: 'AUTHORIZED' });
      const pendingInstitutions = await Institution.countDocuments({ status: 'PENDING' });
      const totalCertificates = await Certificate.countDocuments();
      const revokedCertificates = await Certificate.countDocuments({ isRevoked: true });
      const recentAuditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(20);

      res.status(200).json({
        success: true,
        telemetry: {
          totalInstitutions,
          authorizedInstitutions,
          pendingInstitutions,
          totalCertificates,
          revokedCertificates,
          activeCertificates: totalCertificates - revokedCertificates
        },
        recentAuditLogs
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
