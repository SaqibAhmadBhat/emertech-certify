const { ethers } = require('ethers');
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

      if (status === 'AUTHORIZED') {
        // 1. Validate Ethereum wallet format
        if (!institution.walletAddress || !ethers.utils.isAddress(institution.walletAddress)) {
          institution.onChainAuthorized = false;
          await institution.save();
          return res.status(400).json({
            success: false,
            message: `On-chain authorization failed: Invalid Ethereum wallet address '${institution.walletAddress}'.`,
            onChainAuthorized: false
          });
        }

        // 2. Execute on-chain authorization transaction
        const authResult = await BlockchainService.authorizeInstitution(
          institution.walletAddress,
          institution.name,
          institution.officialDomain
        );

        if (!authResult.onChain) {
          institution.onChainAuthorized = false;
          await institution.save();
          return res.status(502).json({
            success: false,
            message: `On-chain authorization failed: ${authResult.error || 'Transaction reverted or blockchain unavailable.'}`,
            onChainAuthorized: false,
            error: authResult.error
          });
        }

        institution.status = 'AUTHORIZED';
        institution.onChainAuthorized = true;
        institution.onChainStatus = 'AUTHORIZED';
        institution.authorizationTxHash = authResult.txHash;
        institution.approvedAt = new Date();
        institution.approvedByAdmin = req.user._id;
        await institution.save();

        return res.status(200).json({
          success: true,
          message: 'Institution successfully authorized and accredited on-chain.',
          institution,
          txHash: authResult.txHash
        });
      }

      if (status === 'SUSPENDED') {
        const suspResult = await BlockchainService.suspendInstitution(
          institution.walletAddress,
          institution.name,
          institution.officialDomain
        );
        institution.status = 'SUSPENDED';
        institution.onChainAuthorized = false;
        institution.onChainStatus = suspResult.onChain ? 'SUSPENDED' : institution.onChainStatus;
        await institution.save();

        return res.status(200).json({
          success: true,
          message: 'Institution suspended successfully.',
          institution,
          onChain: suspResult.onChain
        });
      }

      if (status === 'REVOKED') {
        const revResult = await BlockchainService.revokeInstitution(
          institution.walletAddress,
          institution.name,
          institution.officialDomain
        );
        institution.status = 'REVOKED';
        institution.onChainAuthorized = false;
        institution.onChainStatus = revResult.onChain ? 'REVOKED' : institution.onChainStatus;
        await institution.save();

        return res.status(200).json({
          success: true,
          message: 'Institution revoked successfully.',
          institution,
          onChain: revResult.onChain
        });
      }

      // PENDING
      institution.status = 'PENDING';
      institution.onChainAuthorized = false;
      await institution.save();

      return res.status(200).json({
        success: true,
        message: 'Institution status set to PENDING.',
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
