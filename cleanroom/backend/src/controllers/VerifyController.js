const { PDFDocument } = require('pdf-lib');
const Certificate = require('../models/Certificate');
const AuditLog = require('../models/AuditLog');
const CryptoService = require('../services/CryptoService');
const BlockchainService = require('../services/BlockchainService');
const OcrService = require('../services/OcrService');

class VerifyController {
  /**
   * Mode 1: Verification by 64-character hexadecimal SHA-256 Hash.
   */
  static async verifyByHash(req, res, next) {
    try {
      const { hash } = req.body;
      if (!hash) {
        return res.status(400).json({ success: false, message: 'Verification hash is required.' });
      }

      const cleanHash = hash.trim().toLowerCase().startsWith('0x')
        ? hash.trim().toLowerCase()
        : `0x${hash.trim().toLowerCase()}`;

      // 1. On-Chain Smart Contract Query
      const blockchainRecord = await BlockchainService.verifyCertificate(cleanHash);

      // 2. Off-Chain Metadata Query
      const dbRecord = await Certificate.findOne({
        $or: [{ certHash: cleanHash }, { fileHash: cleanHash }]
      });

      if (!blockchainRecord.exists && !dbRecord) {
        return res.status(404).json({
          success: false,
          status: 'NOT_FOUND',
          message: 'Certificate hash does not exist in the blockchain or off-chain registry.',
          queryHash: cleanHash
        });
      }

      const isRevoked = blockchainRecord.isRevoked || (dbRecord && dbRecord.isRevoked);

      let status = 'AUTHENTIC';
      if (isRevoked) {
        status = 'REVOKED';
      }

      // Log verification event
      await AuditLog.create({
        eventType: isRevoked ? 'REVOCATION' : 'VERIFICATION_SUCCESS',
        certHash: cleanHash,
        clientIp: req.ip,
        diagnosticDetails: { status, mode: 'HASH_DIRECT', onChain: blockchainRecord.onChain }
      });

      res.status(200).json({
        success: true,
        status,
        verificationData: {
          certHash: cleanHash,
          onChainVerified: blockchainRecord.onChain,
          isRevoked,
          revocationReason: dbRecord ? dbRecord.revocationReason : undefined,
          studentName: dbRecord ? dbRecord.studentName : 'Verified Graduate',
          degreeTitle: dbRecord ? dbRecord.degreeTitle : 'Academic Degree',
          majorProgram: dbRecord ? dbRecord.majorProgram : '',
          graduationDate: dbRecord ? dbRecord.graduationDate : '',
          institutionName: dbRecord ? dbRecord.institutionName : 'Accredited Institution',
          issuerWallet: blockchainRecord.issuer || (dbRecord ? dbRecord.issuerWalletAddress : ''),
          issuedAt: dbRecord ? dbRecord.issuedAt : (blockchainRecord.issuedAt ? new Date(blockchainRecord.issuedAt * 1000) : null),
          ipfsCID: dbRecord ? dbRecord.ipfsCID : blockchainRecord.metadataURI
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mode 2: Verification by Original PDF File Upload (Bitwise Tamper Detection).
   */
  static async verifyByFile(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, message: 'No PDF file uploaded for verification.' });
      }

      const fileBuffer = req.file.buffer;
      const computedHash = CryptoService.computeSha256(fileBuffer);
      const { expectedCertificateId, expectedHash } = req.body;

      // 1. Direct Hash Match
      const exactMatch = await Certificate.findOne({
        $or: [{ fileHash: computedHash }, { certHash: computedHash }]
      });

      if (exactMatch) {
        const isRevoked = exactMatch.isRevoked;
        const status = isRevoked ? 'REVOKED' : 'AUTHENTIC';

        await AuditLog.create({
          eventType: isRevoked ? 'REVOCATION' : 'VERIFICATION_SUCCESS',
          certHash: exactMatch.certHash,
          clientIp: req.ip,
          diagnosticDetails: { status, mode: 'FILE_UPLOAD', computedHash }
        });

        return res.status(200).json({
          success: true,
          status,
          computedHash,
          tamperDetected: false,
          verificationData: {
            certHash: exactMatch.certHash,
            fileHash: exactMatch.fileHash,
            studentName: exactMatch.studentName,
            degreeTitle: exactMatch.degreeTitle,
            majorProgram: exactMatch.majorProgram,
            institutionName: exactMatch.institutionName,
            isRevoked,
            revocationReason: exactMatch.revocationReason
          }
        });
      }

      // 2. Identify target record to evaluate potential tampering
      let targetRecord = null;

      if (expectedCertificateId) {
        targetRecord = await Certificate.findOne({ certificateId: expectedCertificateId });
      } else if (expectedHash) {
        const cleanExpected = expectedHash.toLowerCase();
        targetRecord = await Certificate.findOne({
          $or: [{ certHash: cleanExpected }, { fileHash: cleanExpected }]
        });
      }

      // 3. Fallback: Parse PDF metadata or text stream
      if (!targetRecord) {
        try {
          const loadedPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
          const title = loadedPdf.getTitle();
          const subject = loadedPdf.getSubject();

          if (title || subject) {
            targetRecord = await Certificate.findOne({
              $or: [
                ...(title ? [{ certificateId: title }] : []),
                ...(subject ? [{ certHash: subject.toLowerCase() }, { fileHash: subject.toLowerCase() }] : [])
              ]
            });
          }
        } catch (pdfErr) {
          // Ignore PDF parsing error
        }
      }

      if (!targetRecord) {
        const fileText = fileBuffer.toString('latin1', 0, Math.min(fileBuffer.length, 100000));
        const idMatch = fileText.match(/([A-Z]{3,5}-[0-9A-Z]{6,12}-\d{4})/);
        const hashMatch = fileText.match(/(0x[a-fA-F0-9]{64})/);

        if (idMatch) {
          targetRecord = await Certificate.findOne({ certificateId: idMatch[1] });
        } else if (hashMatch) {
          targetRecord = await Certificate.findOne({ certHash: hashMatch[1].toLowerCase() });
        }
      }

      if (targetRecord) {
        // Document corresponds to a known certificate, but its SHA-256 does NOT match -> TAMPER DETECTED!
        await AuditLog.create({
          eventType: 'TAMPER_DETECTED',
          certHash: targetRecord.certHash,
          clientIp: req.ip,
          diagnosticDetails: {
            mode: 'FILE_UPLOAD_TAMPER',
            expectedHash: targetRecord.fileHash || targetRecord.certHash,
            computedHash
          }
        });

        return res.status(200).json({
          success: true,
          status: 'TAMPER_DETECTED',
          tamperDetected: true,
          message: 'CRITICAL: The uploaded document has been modified. Computed SHA-256 does not match recorded digest.',
          computedHash,
          expectedHash: targetRecord.fileHash || targetRecord.certHash,
          certificateId: targetRecord.certificateId
        });
      }

      // Unregistered document
      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
        message: 'No corresponding certificate found for uploaded document.',
        computedHash
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mode 3: Verification by QR Code Payload.
   */
  static async verifyByQr(req, res, next) {
    try {
      const { qrPayload } = req.body;
      if (!qrPayload) {
        return res.status(400).json({ success: false, message: 'QR payload is required.' });
      }

      // Extract 64-char hex hash from payload
      const hashMatch = qrPayload.match(/0x[a-fA-F0-9]{64}/) || qrPayload.match(/[a-fA-F0-9]{64}/);
      if (!hashMatch) {
        return res.status(400).json({ success: false, message: 'Could not extract valid cryptographic hash from QR payload.' });
      }

      const extractedHash = hashMatch[0].startsWith('0x') ? hashMatch[0] : `0x${hashMatch[0]}`;
      req.body.hash = extractedHash;
      return VerifyController.verifyByHash(req, res, next);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mode 4: Verification by Scanned Physical Image OCR.
   */
  static async verifyByOcr(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, message: 'No image file uploaded for OCR scan.' });
      }

      const ocrRes = await OcrService.extractTextFromImage(req.file.buffer);
      if (!ocrRes.success) {
        return res.status(500).json({ success: false, message: 'OCR processing failed.', error: ocrRes.error });
      }

      const parsed = OcrService.parseAcademicEntities(ocrRes.text);

      // Attempt matching against DB
      let matchedCert = null;
      if (parsed.detectedStudentId) {
        matchedCert = await Certificate.findOne({ studentIdentifier: parsed.detectedStudentId });
      }

      res.status(200).json({
        success: true,
        ocrEngine: 'Tesseract.js WebAssembly Neural OCR',
        extractedText: ocrRes.text,
        parsedEntities: parsed,
        matchFound: !!matchedCert,
        matchedCertificate: matchedCert ? {
          certificateId: matchedCert.certificateId,
          certHash: matchedCert.certHash,
          studentName: matchedCert.studentName,
          degreeTitle: matchedCert.degreeTitle,
          institutionName: matchedCert.institutionName,
          isRevoked: matchedCert.isRevoked
        } : null,
        disclaimer: 'OCR text extraction is an administrative pre-fill assistant. Cryptographic SHA-256 hash or QR code remains the sole definitive cryptographic proof of document integrity and issuer non-repudiation.'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VerifyController;
