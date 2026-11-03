const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { computeSHA256 } = require('../utils/storage');
const contractABI = require('../abi/CertificateRegistry.json');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');

// Helper to sanitize public metadata (prevent leaking private personal data)
function sanitizePublicCertificate(cert) {
  return {
    certificateId: cert.blockchainId,
    blockchainId: cert.blockchainId,
    certificateType: cert.certificateType,
    universityName: cert.universityName,
    universityId: cert.universityId,
    studentName: cert.studentName,
    // Sensitive fields like date of birth, personal address, phone are omitted
    program: cert.program || cert.course,
    course: cert.course || cert.program,
    semester: cert.semester,
    yearOfGraduation: cert.yearOfGraduation,
    dateOfIssue: cert.dateOfIssue,
    documentHash: cert.documentHash,
    ipfsHash: cert.ipfsHash,
    storageType: cert.storageType,
    status: cert.status,
    verifiedOnChain: cert.verifiedOnChain,
    blockchainTxHash: cert.blockchainTxHash,
    blockNumber: cert.blockNumber,
    revocationReason: cert.status === 'revoked' ? cert.revocationReason : undefined,
    revokedAt: cert.status === 'revoked' ? cert.revokedAt : undefined
  };
}

// Get approved universities for public dropdown
async function getApprovedUniversities(req, res) {
  try {
    const universities = await User.find({ 
      role: 'university',
      'universityDetails.approved': true 
    }).select('universityDetails.universityName universityDetails.universityId');
    
    const universityList = universities.map(uni => ({
      name: uni.universityDetails?.universityName,
      id: uni.universityDetails?.universityId
    }));
    
    res.json({
      success: true,
      universities: universityList
    });
  } catch (error) {
    console.error('Get approved universities error:', error);
    res.status(500).json({ success: false, msg: 'Server error retrieving universities' });
  }
}

// Verify certificate by Blockchain ID
async function verifyCertificate(req, res) {
  try {
    const { blockchainId } = req.params;
    
    if (!blockchainId) {
      return res.status(400).json({
        success: false,
        valid: false,
        status: 'INVALID_REQUEST',
        msg: 'Certificate ID is required'
      });
    }

    const cleanId = blockchainId.trim();
    const certificate = await Certificate.findByBlockchainId(cleanId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        status: 'NOT_FOUND',
        msg: `Certificate ID "${cleanId}" does not exist in the Emertech Certify registry.`
      });
    }

    // Check on-chain blockchain status if configured
    let onChainStatus = null;
    if (process.env.RPC_URL && process.env.CONTRACT_ADDRESS) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI.abi, provider);
        const [isValid, statusStr] = await contract.verifyCertificate(cleanId, certificate.documentHash);
        onChainStatus = { isValid, status: statusStr };
      } catch (bcErr) {
        // contract query fallback
      }
    }

    if (certificate.status === 'revoked') {
      return res.json({
        success: true,
        valid: false,
        status: 'REVOKED',
        msg: 'WARNING: This academic certificate has been REVOKED by the issuing authority.',
        revocationReason: certificate.revocationReason || 'Administrative revocation',
        revokedAt: certificate.revokedAt,
        certificate: sanitizePublicCertificate(certificate),
        onChainStatus
      });
    }

    return res.json({
      success: true,
      valid: true,
      status: 'AUTHENTIC',
      msg: 'VERIFIED AUTHENTIC: Certificate record is valid and registered in the academic verification system.',
      certificate: sanitizePublicCertificate(certificate),
      onChainStatus
    });

  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      status: 'ERROR',
      msg: 'Server error while verifying certificate'
    });
  }
}

// Verify certificate by uploaded PDF binary (SHA-256 hash match)
async function verifyCertificateByPdf(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      valid: false,
      status: 'MISSING_FILE',
      msg: 'Please upload a PDF certificate file to verify.'
    });
  }

  const filePath = req.file.path;

  try {
    // 1. Calculate SHA-256 cryptographic digest of the uploaded PDF
    const computedHash = computeSHA256(filePath);
    console.log('Verifying uploaded PDF. Computed SHA-256:', computedHash);

    // 2. Query registry by documentHash
    const certificate = await Certificate.findByDocumentHash(computedHash);

    // Also check if user supplied an expected blockchainId or if text contains one
    const providedId = req.body.blockchainId ? req.body.blockchainId.trim() : null;

    if (certificate) {
      // Matching hash found in registry!
      const isRevoked = certificate.status === 'revoked';

      // Check smart contract
      let onChainValid = certificate.verifiedOnChain;
      if (process.env.RPC_URL && process.env.CONTRACT_ADDRESS) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
          const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI.abi, provider);
          const [isValid, statusStr] = await contract.verifyCertificate(certificate.blockchainId, computedHash);
          onChainValid = isValid;
        } catch (e) {
          // ignore
        }
      }

      if (isRevoked) {
        return res.json({
          success: true,
          valid: false,
          status: 'REVOKED',
          msg: 'REVOKED DOCUMENT: The uploaded certificate matches a known record, but was REVOKED by the issuing authority.',
          computedHash,
          revocationReason: certificate.revocationReason,
          revokedAt: certificate.revokedAt,
          certificate: sanitizePublicCertificate(certificate)
        });
      }

      return res.json({
        success: true,
        valid: true,
        status: 'AUTHENTIC',
        msg: 'AUTHENTIC DOCUMENT: Uploaded certificate matches the immutable cryptographic hash on the blockchain registry exactly.',
        computedHash,
        certificate: sanitizePublicCertificate(certificate)
      });
    }

    // If exact hash not found, check if a Certificate ID was supplied to detect tampering
    if (providedId) {
      const existingCertWithId = await Certificate.findByBlockchainId(providedId);
      if (existingCertWithId) {
        return res.json({
          success: true,
          valid: false,
          status: 'TAMPERED',
          msg: 'TAMPERING DETECTED: The certificate ID exists in our registry, but the SHA-256 hash of this uploaded document DOES NOT match the recorded hash. This file has been altered or forged.',
          expectedHash: existingCertWithId.documentHash,
          computedHash,
          certificateId: providedId
        });
      }
    }

    // No match
    return res.status(404).json({
      success: false,
      valid: false,
      status: 'NOT_FOUND',
      msg: 'UNREGISTERED DOCUMENT: No certificate matching this document hash was found in the official registry.',
      computedHash
    });

  } catch (err) {
    console.error('PDF verification error:', err);
    res.status(500).json({ success: false, valid: false, status: 'ERROR', msg: err.message });
  } finally {
    // Delete temporary uploaded file
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
  }
}

// Verify certificate by QR code image or payload
async function verifyCertificateByQr(req, res) {
  try {
    let blockchainId = req.body.qrData || req.body.blockchainId;

    // If a QR image file was uploaded, decode it
    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      try {
        const png = PNG.sync.read(fileBuffer);
        const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
        if (code && code.data) {
          blockchainId = code.data;
        }
      } catch (qrDecodeErr) {
        console.warn('QR image decode failed:', qrDecodeErr.message);
      } finally {
        if (fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
      }
    }

    if (!blockchainId) {
      return res.status(400).json({
        success: false,
        valid: false,
        status: 'INVALID_QR',
        msg: 'Unable to decode QR code. Please provide a clear QR image or Certificate ID.'
      });
    }

    // If the QR contains a full URL (e.g., https://.../verify?id=UN01-CERT-...), extract the ID parameter
    if (blockchainId.includes('?id=')) {
      const urlParams = new URLSearchParams(blockchainId.split('?')[1]);
      blockchainId = urlParams.get('id');
    } else if (blockchainId.includes('/verify/')) {
      const parts = blockchainId.split('/verify/');
      blockchainId = parts[parts.length - 1];
    }

    // Forward to ID verification logic
    req.params.blockchainId = blockchainId;
    return verifyCertificate(req, res);

  } catch (err) {
    console.error('QR verification error:', err);
    res.status(500).json({ success: false, valid: false, status: 'ERROR', msg: err.message });
  }
}

// Download certificate PDF
async function downloadCertificate(req, res) {
  try {
    const { blockchainId } = req.params;
    const certificate = await Certificate.findByBlockchainId(blockchainId);

    if (!certificate || !certificate.pdfPath) {
      return res.status(404).json({ success: false, msg: 'Certificate PDF not available' });
    }

    const fullPdfPath = path.join(__dirname, '..', certificate.pdfPath);
    if (!fs.existsSync(fullPdfPath)) {
      return res.status(404).json({ success: false, msg: 'Certificate file not found on storage server' });
    }

    res.download(fullPdfPath, `${certificate.blockchainId}.pdf`);
  } catch (err) {
    console.error('Download certificate error:', err);
    res.status(500).json({ success: false, msg: 'Error downloading certificate' });
  }
}

module.exports = {
  getApprovedUniversities,
  verifyCertificate,
  verifyCertificateByPdf,
  verifyCertificateByQr,
  downloadCertificate
};
