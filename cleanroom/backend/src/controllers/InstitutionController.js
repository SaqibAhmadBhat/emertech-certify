const Institution = require('../models/Institution');
const Certificate = require('../models/Certificate');
const AuditLog = require('../models/AuditLog');
const CryptoService = require('../services/CryptoService');
const BlockchainService = require('../services/BlockchainService');
const PdfVectorService = require('../services/PdfVectorService');
const StorageService = require('../services/StorageService');

class InstitutionController {
  static async apply(req, res, next) {
    try {
      const { institutionCode, name, officialDomain, contactEmail, walletAddress, accreditedBy } = req.body;

      if (!institutionCode || !name || !officialDomain || !contactEmail || !walletAddress) {
        return res.status(400).json({ success: false, message: 'All institutional fields are required.' });
      }

      const existing = await Institution.findOne({ institutionCode: institutionCode.toUpperCase().trim() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Institution code already registered.' });
      }

      const institution = await Institution.create({
        institutionCode: institutionCode.toUpperCase().trim(),
        name,
        officialDomain,
        contactEmail: contactEmail.toLowerCase().trim(),
        walletAddress,
        accreditedBy: accreditedBy || 'National Accreditation Board',
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
      const {
        studentName,
        studentIdentifier,
        degreeTitle,
        majorProgram,
        graduationDate,
        gradeOrDistinction
      } = req.body;

      if (!studentName || !studentIdentifier || !degreeTitle || !majorProgram || !graduationDate) {
        return res.status(400).json({ success: false, message: 'Missing required student/academic fields.' });
      }

      const institutionCode = req.user.institutionCode || 'GCE';
      const institutionName = 'Government College of Engineering, Tirunelveli';
      const issuerWallet = req.user.walletAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

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

      // 4. Anchor to Ethereum Smart Contract
      const recipientIdHash = CryptoService.computeSha256(studentIdentifier);
      const blockchainResult = await BlockchainService.registerCertificate(
        certHash,
        recipientIdHash,
        storageResult.ipfsCID
      );

      // 5. Save to MongoDB
      const certificate = await Certificate.create({
        certificateId,
        certHash,
        fileHash,
        canonicalString,
        studentName,
        studentIdentifier,
        degreeTitle,
        majorProgram,
        graduationDate,
        gradeOrDistinction: gradeOrDistinction || 'First Class with Distinction',
        institutionCode,
        institutionName,
        issuerWalletAddress: issuerWallet,
        ipfsCID: storageResult.ipfsCID,
        storagePath: storageResult.storagePath,
        blockchainTxHash: blockchainResult.txHash,
        issuedAt: new Date(issuedAtTimestamp * 1000)
      });

      // 6. Audit Trail
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
        message: 'Academic certificate issued and anchored to blockchain.',
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
          const institutionCode = req.user.institutionCode || 'GCE';
          const institutionName = 'Government College of Engineering, Tirunelveli';
          const certificateId = `${institutionCode}-${Date.now().toString(36).toUpperCase()}-${(item.studentIdentifier || '0000').slice(-4)}`;
          const issuedAtTimestamp = Math.floor(Date.now() / 1000);

          const { canonicalString, certHash } = CryptoService.computeCertificateHash({
            institutionCode,
            studentIdentifier: item.studentIdentifier,
            studentName: item.studentName,
            degreeTitle: item.degreeTitle || 'Bachelor of Engineering',
            majorProgram: item.majorProgram || 'Computer Science and Engineering',
            graduationDate: item.graduationDate || '2026-05-15',
            issuedAtTimestamp
          });

          const pdfBuffer = await PdfVectorService.generateCertificatePdf({
            certificateId,
            certHash,
            studentName: item.studentName,
            studentIdentifier: item.studentIdentifier,
            degreeTitle: item.degreeTitle || 'Bachelor of Engineering',
            majorProgram: item.majorProgram || 'Computer Science and Engineering',
            graduationDate: item.graduationDate || '2026-05-15',
            gradeOrDistinction: item.gradeOrDistinction || 'First Class with Distinction',
            institutionName,
            verificationUrl: `http://localhost:3000/verify?hash=${certHash}`
          });

          const fileHash = CryptoService.computeSha256(pdfBuffer);
          const storageResult = await StorageService.persistDocument(pdfBuffer, 'pdf', certHash);
          const recipientIdHash = CryptoService.computeSha256(item.studentIdentifier);
          const bcRes = await BlockchainService.registerCertificate(certHash, recipientIdHash, storageResult.ipfsCID);

          const cert = await Certificate.create({
            certificateId,
            certHash,
            fileHash,
            canonicalString,
            studentName: item.studentName,
            studentIdentifier: item.studentIdentifier,
            degreeTitle: item.degreeTitle || 'Bachelor of Engineering',
            majorProgram: item.majorProgram || 'Computer Science and Engineering',
            graduationDate: item.graduationDate || '2026-05-15',
            gradeOrDistinction: item.gradeOrDistinction || 'First Class with Distinction',
            institutionCode,
            institutionName,
            issuerWalletAddress: req.user.walletAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            ipfsCID: storageResult.ipfsCID,
            storagePath: storageResult.storagePath,
            blockchainTxHash: bcRes.txHash,
            issuedAt: new Date(issuedAtTimestamp * 1000)
          });

          results.push({ studentIdentifier: item.studentIdentifier, certificateId: cert.certificateId, certHash: cert.certHash, status: 'SUCCESS' });
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
      await certificate.save();

      // 3. Log Audit
      await AuditLog.create({
        eventType: 'REVOCATION',
        certHash,
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        clientIp: req.ip,
        diagnosticDetails: { reason, txHash: bcRes.txHash }
      });

      res.status(200).json({
        success: true,
        message: 'Certificate successfully revoked on-chain and in off-chain registry.',
        certificate: {
          certHash: certificate.certHash,
          isRevoked: certificate.isRevoked,
          revokedAt: certificate.revokedAt,
          revocationReason: certificate.revocationReason
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async listCertificates(req, res, next) {
    try {
      const institutionCode = req.user.institutionCode || 'GCE';
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
