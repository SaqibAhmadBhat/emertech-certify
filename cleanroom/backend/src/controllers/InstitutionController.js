const Certificate = require('../models/Certificate');
const Institution = require('../models/Institution');
const AuditLog = require('../models/AuditLog');
const CryptoService = require('../services/CryptoService');
const PdfVectorService = require('../services/PdfVectorService');
const BlockchainService = require('../services/BlockchainService');
const StorageService = require('../services/StorageService');

class InstitutionController {
  static async apply(req, res, next) {
    return InstitutionController.applyInstitution(req, res, next);
  }

  static async applyInstitution(req, res, next) {
    try {
      const { institutionCode, name, officialDomain, contactEmail, walletAddress } = req.body;
      if (!institutionCode || !name || !officialDomain || !contactEmail || !walletAddress) {
        return res.status(400).json({ success: false, message: 'All institutional fields are required.' });
      }

      const existing = await Institution.findOne({
        $or: [{ institutionCode: institutionCode.toUpperCase() }, { walletAddress: walletAddress.toLowerCase() }]
      });

      if (existing) {
        return res.status(400).json({ success: false, message: 'Institution code or wallet address already registered.' });
      }

      const institution = await Institution.create({
        institutionCode: institutionCode.toUpperCase(),
        name,
        officialDomain,
        contactEmail,
        walletAddress: walletAddress.toLowerCase(),
        status: 'PENDING'
      });

      res.status(201).json({
        success: true,
        message: 'Institution application submitted for administrative review.',
        institution
      });
    } catch (err) {
      next(err);
    }
  }

  static async issueCertificate(req, res, next) {
    try {
      const studentName = req.body.studentName || req.body.fullName;
      const {
        studentIdentifier,
        degreeTitle,
        majorProgram,
        graduationDate,
        gradeOrDistinction
      } = req.body;

      if (!studentName || !studentIdentifier || !degreeTitle || !majorProgram || !graduationDate) {
        return res.status(400).json({ success: false, message: 'Missing required student/academic fields.' });
      }

      const institutionCode = req.user.institutionCode || 'INST';
      const institutionName = req.user.institutionName || 'Accredited Academic Institution';
      const issuerWallet = req.user.walletAddress || '';

      const certificateId = `${institutionCode}-${Date.now().toString(36).toUpperCase()}-${studentIdentifier.slice(-4)}`;
      const issuedAtTimestamp = Math.floor(Date.now() / 1000);

      // 1. Deterministic Cryptographic Digest
      const { canonicalString, certHash } = CryptoService.computeCertificateHash({
        institutionCode,
        studentIdentifier,
        studentName,
        degreeTitle,
        majorProgram,
        graduationDate,
        issuedAtTimestamp
      });

      // 2. Generate Vector PDF with dynamic QR stamp
      const pdfBuffer = await PdfVectorService.generateCertificatePdf({
        certificateId,
        certHash,
        studentName,
        studentIdentifier,
        degreeTitle,
        majorProgram,
        graduationDate,
        gradeOrDistinction: gradeOrDistinction || 'First Class with Distinction',
        institutionName,
        verificationUrl: `http://localhost:3000/verify?hash=${certHash}`
      });

      const fileHash = CryptoService.computeSha256(pdfBuffer);

      // 3. Persist document
      const storageResult = await StorageService.persistDocument(pdfBuffer, 'pdf', certHash);

      // 4. Generate high-entropy salt and pseudonymized recipient ID hash
      const recipientSalt = CryptoService.generateSalt(16);
      const recipientIdHash = CryptoService.computeSaltedRecipientHash(studentIdentifier, recipientSalt);

      // 5. Anchor to Ethereum Smart Contract
      const blockchainResult = await BlockchainService.registerCertificate(
        certHash,
        recipientIdHash,
        storageResult.ipfsCID
      );

      // 6. Save to MongoDB
      const certificate = await Certificate.create({
        certificateId,
        certHash,
        fileHash,
        canonicalString,
        studentName,
        studentIdentifier,
        recipientSalt,
        recipientIdHash,
        degreeTitle,
        majorProgram,
        graduationDate,
        gradeOrDistinction: gradeOrDistinction || 'First Class with Distinction',
        institutionCode,
        institutionName,
        issuerWalletAddress: issuerWallet,
        ipfsCID: storageResult.ipfsCID,
        storagePath: storageResult.storagePath,
        blockchainTxHash: blockchainResult.txHash || null,
        onChainAnchored: blockchainResult.onChain,
        issuedAt: new Date(issuedAtTimestamp * 1000)
      });

      // 7. Audit Trail
      await AuditLog.create({
        eventType: 'ISSUANCE',
        certHash,
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        clientIp: req.ip,
        diagnosticDetails: { certificateId, txHash: blockchainResult.txHash, onChain: blockchainResult.onChain }
      });

      res.status(201).json({
        success: true,
        message: blockchainResult.onChain
          ? 'Academic certificate issued and anchored to blockchain.'
          : 'Academic certificate issued in offline demonstration mode (not anchored on-chain).',
        certificate: {
          certificateId: certificate.certificateId,
          certHash: certificate.certHash,
          fileHash: certificate.fileHash,
          studentName: certificate.studentName,
          degreeTitle: certificate.degreeTitle,
          majorProgram: certificate.majorProgram,
          issuedAt: certificate.issuedAt,
          txHash: blockchainResult.txHash,
          onChain: blockchainResult.onChain,
          ipfsCID: storageResult.ipfsCID
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async batchIssueCertificates(req, res, next) {
    try {
      const { batch } = req.body;
      if (!Array.isArray(batch) || batch.length === 0) {
        return res.status(400).json({ success: false, message: 'Batch must be a non-empty array of students.' });
      }

      const results = [];
      for (const item of batch) {
        try {
          const institutionCode = req.user.institutionCode || 'INST';
          const institutionName = req.user.institutionName || 'Accredited Academic Institution';
          const certificateId = `${institutionCode}-${Date.now().toString(36).toUpperCase()}-${(item.studentIdentifier || '0000').slice(-4)}`;
          const issuedAtTimestamp = Math.floor(Date.now() / 1000);

          const { canonicalString, certHash } = CryptoService.computeCertificateHash({
            institutionCode,
            studentIdentifier: item.studentIdentifier,
            studentName: item.studentName,
            degreeTitle: item.degreeTitle || 'Bachelor of Science',
            majorProgram: item.majorProgram || 'Computer Engineering',
            graduationDate: item.graduationDate || '2026-05-15',
            issuedAtTimestamp
          });

          const pdfBuffer = await PdfVectorService.generateCertificatePdf({
            certificateId,
            certHash,
            studentName: item.studentName,
            studentIdentifier: item.studentIdentifier,
            degreeTitle: item.degreeTitle || 'Bachelor of Science',
            majorProgram: item.majorProgram || 'Computer Engineering',
            graduationDate: item.graduationDate || '2026-05-15',
            gradeOrDistinction: item.gradeOrDistinction || 'First Class with Distinction',
            institutionName,
            verificationUrl: `http://localhost:3000/verify?hash=${certHash}`
          });

          const fileHash = CryptoService.computeSha256(pdfBuffer);
          const storageResult = await StorageService.persistDocument(pdfBuffer, 'pdf', certHash);
          const recipientSalt = CryptoService.generateSalt(16);
          const recipientIdHash = CryptoService.computeSaltedRecipientHash(item.studentIdentifier, recipientSalt);
          const bcRes = await BlockchainService.registerCertificate(certHash, recipientIdHash, storageResult.ipfsCID);

          const cert = await Certificate.create({
            certificateId,
            certHash,
            fileHash,
            canonicalString,
            studentName: item.studentName,
            studentIdentifier: item.studentIdentifier,
            recipientSalt,
            recipientIdHash,
            degreeTitle: item.degreeTitle || 'Bachelor of Science',
            majorProgram: item.majorProgram || 'Computer Engineering',
            graduationDate: item.graduationDate || '2026-05-15',
            gradeOrDistinction: item.gradeOrDistinction || 'First Class with Distinction',
            institutionCode,
            institutionName,
            issuerWalletAddress: req.user.walletAddress || '',
            ipfsCID: storageResult.ipfsCID,
            storagePath: storageResult.storagePath,
            blockchainTxHash: bcRes.txHash || null,
            onChainAnchored: bcRes.onChain,
            issuedAt: new Date(issuedAtTimestamp * 1000)
          });

          results.push({
            studentIdentifier: item.studentIdentifier,
            certificateId: cert.certificateId,
            certHash: cert.certHash,
            txHash: bcRes.txHash,
            onChain: bcRes.onChain,
            status: 'SUCCESS'
          });
        } catch (itemErr) {
          results.push({ studentIdentifier: item.studentIdentifier, status: 'FAILED', error: itemErr.message });
        }
      }

      res.status(200).json({ success: true, processed: results.length, results });
    } catch (err) {
      next(err);
    }
  }

  static async revokeCertificate(req, res, next) {
    try {
      const { certHash, reason } = req.body;
      if (!certHash) {
        return res.status(400).json({ success: false, message: 'Certificate hash is required for revocation.' });
      }

      const certificate = await Certificate.findOne({ certHash: certHash.toLowerCase().trim() });
      if (!certificate) {
        return res.status(404).json({ success: false, message: 'Certificate record not found.' });
      }
      if (certificate.isRevoked) {
        return res.status(400).json({ success: false, message: 'Certificate is already revoked.' });
      }

      // 1. Revoke on Smart Contract
      const bcRes = await BlockchainService.revokeCertificate(certHash, reason || 'Administrative update');

      // 2. Update Database Record
      certificate.isRevoked = true;
      certificate.revokedAt = new Date();
      certificate.revocationReason = reason || 'Administrative correction';
      certificate.revocationTxHash = bcRes.txHash || null;
      await certificate.save();

      // 3. Log Audit
      await AuditLog.create({
        eventType: 'REVOCATION',
        certHash,
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        clientIp: req.ip,
        diagnosticDetails: { reason, txHash: bcRes.txHash, onChain: bcRes.onChain }
      });

      res.status(200).json({
        success: true,
        message: bcRes.onChain
          ? 'Certificate successfully revoked on-chain and in off-chain registry.'
          : 'Certificate revoked in off-chain registry (smart contract was not connected).',
        certificate: {
          certHash: certificate.certHash,
          isRevoked: certificate.isRevoked,
          revokedAt: certificate.revokedAt,
          revocationReason: certificate.revocationReason,
          txHash: bcRes.txHash,
          onChain: bcRes.onChain
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async listCertificates(req, res, next) {
    try {
      const institutionCode = req.user.institutionCode || 'INST';
      const certificates = await Certificate.find({ institutionCode }).sort({ issuedAt: -1 }).limit(100);

      res.status(200).json({
        success: true,
        count: certificates.length,
        certificates
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InstitutionController;
