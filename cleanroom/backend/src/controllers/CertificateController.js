const fs = require('fs');
const Certificate = require('../models/Certificate');
const StorageService = require('../services/StorageService');
const PdfVectorService = require('../services/PdfVectorService');

class CertificateController {
  static async getCertificateById(req, res, next) {
    try {
      const { id } = req.params;
      const certificate = await Certificate.findOne({
        $or: [{ certificateId: id }, { certHash: id.toLowerCase().trim() }]
      });

      if (!certificate) {
        return res.status(404).json({ success: false, message: 'Certificate record not found.' });
      }

      res.status(200).json({
        success: true,
        certificate: {
          certificateId: certificate.certificateId,
          certHash: certificate.certHash,
          studentName: certificate.studentName,
          degreeTitle: certificate.degreeTitle,
          majorProgram: certificate.majorProgram,
          graduationDate: certificate.graduationDate,
          institutionName: certificate.institutionName,
          isRevoked: certificate.isRevoked,
          revocationReason: certificate.isRevoked ? certificate.revocationReason : undefined,
          issuedAt: certificate.issuedAt,
          ipfsCID: certificate.ipfsCID,
          blockchainTxHash: certificate.blockchainTxHash
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async downloadPdf(req, res, next) {
    try {
      const { id } = req.params;
      const certificate = await Certificate.findOne({
        $or: [{ certificateId: id }, { certHash: id.toLowerCase().trim() }]
      });

      if (!certificate) {
        return res.status(404).json({ success: false, message: 'Certificate not found.' });
      }

      let pdfBuffer = null;
      if (certificate.storagePath && fs.existsSync(certificate.storagePath)) {
        pdfBuffer = await fs.promises.readFile(certificate.storagePath);
      }

      if (!pdfBuffer) {
        pdfBuffer = await StorageService.getDocumentByHash(certificate.certHash, 'pdf');
      }

      // If missing locally, re-compile vector PDF on the fly
      if (!pdfBuffer) {
        pdfBuffer = await PdfVectorService.generateCertificatePdf({
          certificateId: certificate.certificateId,
          certHash: certificate.certHash,
          studentName: certificate.studentName,
          studentIdentifier: certificate.studentIdentifier,
          degreeTitle: certificate.degreeTitle,
          majorProgram: certificate.majorProgram,
          graduationDate: certificate.graduationDate,
          gradeOrDistinction: certificate.gradeOrDistinction,
          institutionName: certificate.institutionName,
          verificationUrl: `http://localhost:3000/verify?hash=${certificate.certHash}`
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentCertificates(req, res, next) {
    try {
      const studentIdentifier = req.user.studentIdentifier;
      if (!studentIdentifier) {
        return res.status(400).json({ success: false, message: 'No student identifier associated with account.' });
      }

      const certificates = await Certificate.find({ studentIdentifier }).sort({ issuedAt: -1 });

      res.status(200).json({
        success: true,
        count: certificates.length,
        certificates: certificates.map(c => ({
          certificateId: c.certificateId,
          certHash: c.certHash,
          studentName: c.studentName,
          degreeTitle: c.degreeTitle,
          majorProgram: c.majorProgram,
          graduationDate: c.graduationDate,
          gradeOrDistinction: c.gradeOrDistinction,
          institutionName: c.institutionName,
          isRevoked: c.isRevoked,
          issuedAt: c.issuedAt,
          ipfsCID: c.ipfsCID
        }))
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CertificateController;
