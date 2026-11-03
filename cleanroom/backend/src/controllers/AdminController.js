const { ethers } = require('ethers');
const Institution = require('../models/Institution');
const Certificate = require('../models/Certificate');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const BlockchainService = require('../services/BlockchainService');
const KeyVaultService = require('../services/KeyVaultService');

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

          await AuditLog.create({
            eventType: 'INSTITUTION_AUTHORIZATION_FAILED',
            actorId: req.user._id,
            actorEmail: req.user.email,
            actorRole: req.user.role,
            clientIp: req.ip,
            diagnosticDetails: { institutionId: institution._id, code: institution.institutionCode, error: authResult.error }
          });

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

        await AuditLog.create({
          eventType: 'INSTITUTION_AUTHORIZED',
          actorId: req.user._id,
          actorEmail: req.user.email,
          actorRole: req.user.role,
          clientIp: req.ip,
          diagnosticDetails: { institutionId: institution._id, code: institution.institutionCode, txHash: authResult.txHash }
        });

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

        if (!suspResult.onChain) {
          await AuditLog.create({
            eventType: 'INSTITUTION_SUSPENSION_FAILED',
            actorId: req.user._id,
            actorEmail: req.user.email,
            actorRole: req.user.role,
            clientIp: req.ip,
            diagnosticDetails: { institutionId: institution._id, code: institution.institutionCode, error: suspResult.error }
          });

          return res.status(502).json({
            success: false,
            message: `On-chain institution suspension failed: ${suspResult.error || 'Transaction reverted or blockchain unavailable.'}`,
            onChain: false,
            error: suspResult.error
          });
        }

        institution.status = 'SUSPENDED';
        institution.onChainAuthorized = false;
        institution.onChainStatus = 'SUSPENDED';
        await institution.save();

        await AuditLog.create({
          eventType: 'INSTITUTION_SUSPENDED',
          actorId: req.user._id,
          actorEmail: req.user.email,
          actorRole: req.user.role,
          clientIp: req.ip,
          diagnosticDetails: { institutionId: institution._id, code: institution.institutionCode, txHash: suspResult.txHash, onChain: true }
        });

        return res.status(200).json({
          success: true,
          message: 'Institution suspended successfully on-chain and off-chain.',
          institution,
          onChain: true,
          txHash: suspResult.txHash
        });
      }

      if (status === 'REVOKED') {
        const revResult = await BlockchainService.revokeInstitution(
          institution.walletAddress,
          institution.name,
          institution.officialDomain
        );

        if (!revResult.onChain) {
          await AuditLog.create({
            eventType: 'INSTITUTION_REVOCATION_FAILED',
            actorId: req.user._id,
            actorEmail: req.user.email,
            actorRole: req.user.role,
            clientIp: req.ip,
            diagnosticDetails: { institutionId: institution._id, code: institution.institutionCode, error: revResult.error }
          });

          return res.status(502).json({
            success: false,
            message: `On-chain institution revocation failed: ${revResult.error || 'Transaction reverted or blockchain unavailable.'}`,
            onChain: false,
            error: revResult.error
          });
        }

        institution.status = 'REVOKED';
        institution.onChainAuthorized = false;
        institution.onChainStatus = 'REVOKED';
        await institution.save();

        await AuditLog.create({
          eventType: 'INSTITUTION_REVOKED',
          actorId: req.user._id,
          actorEmail: req.user.email,
          actorRole: req.user.role,
          clientIp: req.ip,
          diagnosticDetails: { institutionId: institution._id, code: institution.institutionCode, txHash: revResult.txHash, onChain: true }
        });

        return res.status(200).json({
          success: true,
          message: 'Institution revoked successfully on-chain and off-chain.',
          institution,
          onChain: true,
          txHash: revResult.txHash
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

  static async provisionInstitutionAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'All fields (email, password, fullName) are required for institution administrator provisioning.'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address format.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      }

      const institution = await Institution.findById(id);
      if (!institution) {
        return res.status(404).json({ success: false, message: 'Institution record not found.' });
      }

      if (institution.status !== 'AUTHORIZED' || !institution.onChainAuthorized) {
        return res.status(400).json({
          success: false,
          message: `Cannot provision administrator: Institution '${institution.institutionCode}' must be accredited and onChainAuthorized. Current status: ${institution.status}.`
        });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'User with this email already exists.' });
      }

      const passwordHash = await User.hashPassword(password);
      const newUser = await User.create({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'INSTITUTION_ADMIN',
        institutionCode: institution.institutionCode,
        walletAddress: institution.walletAddress,
        isActive: true
      });

      await AuditLog.create({
        eventType: 'ADMIN_PROVISIONED',
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        clientIp: req.ip,
        diagnosticDetails: {
          institutionId: institution._id,
          institutionCode: institution.institutionCode,
          provisionedAdminEmail: newUser.email,
          provisionedAdminId: newUser._id
        }
      });

      return res.status(201).json({
        success: true,
        message: `Institution administrator provisioned successfully for ${institution.name}.`,
        user: {
          id: newUser._id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          institutionCode: newUser.institutionCode,
          walletAddress: newUser.walletAddress,
          isActive: newUser.isActive
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async setupKeyCustody(req, res, next) {
    try {
      const { id } = req.params;
      const { privateKey } = req.body;

      if (!privateKey) {
        return res.status(400).json({ success: false, message: 'Private key is required for institutional key custody setup.' });
      }

      const institution = await Institution.findById(id);
      if (!institution) {
        return res.status(404).json({ success: false, message: 'Institution record not found.' });
      }

      const storeResult = await KeyVaultService.storeInstitutionEncryptedKey(institution._id, privateKey);

      await AuditLog.create({
        eventType: 'SECURITY_ALERT',
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        clientIp: req.ip,
        diagnosticDetails: {
          action: 'INSTITUTION_KEY_CUSTODY_PROVISIONED',
          institutionCode: institution.institutionCode,
          walletAddress: institution.walletAddress,
          keyVersion: storeResult.keyVersion
        }
      });

      return res.status(200).json({
        success: true,
        message: `Persistent signing credential encrypted and stored in custody for ${institution.name}.`,
        institutionCode: institution.institutionCode,
        walletAddress: institution.walletAddress,
        keyVersion: storeResult.keyVersion
      });
    } catch (err) {
      if (err.message && err.message.includes('KeyVault Error')) {
        return res.status(400).json({ success: false, message: err.message });
      }
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
