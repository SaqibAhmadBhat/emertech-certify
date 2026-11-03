const fs = require('fs');
const path = require('path');
const Certificate = require('../models/Certificate');
const Template = require('../models/Template');
const User = require('../models/User');
const { renderTemplateToPdf } = require('../utils/pdfGenerator');
const { storeCertificateDocument } = require('../utils/storage');
const { generateQRCodeDataURI } = require('../utils/qr');
const { ethers } = require('ethers');
const contractABI = require('../abi/CertificateRegistry.json');

// Generate unique blockchain ID
function generateBlockchainId(universityId = 'UN01') {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${universityId.toUpperCase()}-CERT-${random}-${dateStr}`;
}

// Get university profile
async function getUniversityProfile(req, res) {
  try {
    if (req.user.role !== 'university' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: Insufficient privileges' });
    }

    const university = await User.findById(req.user.userId).select('-password');
    if (!university) {
      return res.status(404).json({ msg: 'Institution profile not found' });
    }

    const transformedUniversity = {
      ...university.toObject(),
      universityDetails: university.universityDetails ? {
        universityName: university.universityDetails.universityName,
        universityId: university.universityDetails.universityId,
        address: university.universityDetails.officialAddress,
        phone: university.universityDetails.contactNumber,
        registrationNumber: university.universityDetails.accreditationId,
        city: university.universityDetails.city,
        state: university.universityDetails.state,
        country: university.universityDetails.country,
        contactPersonName: university.universityDetails.contactPersonName,
        coursesOffered: university.universityDetails.coursesOffered,
        approved: university.universityDetails.approved,
        approvedBy: university.universityDetails.approvedBy,
        approvalDate: university.universityDetails.approvalDate
      } : null
    };

    res.json({ 
      success: true, 
      university: transformedUniversity 
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ msg: 'Server error retrieving institution profile', error: err.message });
  }
}

// Upload custom EJS/HTML template
async function uploadTemplate(req, res) {
  try {
    if (req.user.role !== 'university' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: Only authorized institutions can upload templates' });
    }

    const { templateName, certificateType } = req.body;
    const universityId = req.user.userId;

    if (!templateName || !certificateType || !req.file) {
      return res.status(400).json({ msg: 'Template name, certificate type, and file are required' });
    }

    const university = await User.findById(universityId);
    const univCode = university?.universityDetails?.universityId || 'un01';

    const templateDir = path.join(__dirname, '..', 'templates', univCode);
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (!['.ejs', '.html', '.htm'].includes(fileExt)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: 'Invalid file format. Upload .ejs or .html file' });
    }

    const ejsFileName = `${certificateType}_${Date.now()}.ejs`;
    const finalTemplatePath = path.join(templateDir, ejsFileName);
    fs.copyFileSync(req.file.path, finalTemplatePath);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const template = new Template({
      templateName: templateName.trim(),
      certificateType,
      university: universityId,
      universityId: univCode,
      templatePath: `templates/${univCode}/${ejsFileName}`,
      placeholders: [],
      isActive: true
    });

    await template.save();

    res.json({ 
      success: true,
      msg: 'Template uploaded and registered successfully', 
      template: {
        id: template._id,
        templateName: template.templateName,
        certificateType: template.certificateType
      }
    });
  } catch (err) {
    console.error('Upload template error:', err);
    res.status(500).json({ msg: 'Server error uploading template', error: err.message });
  }
}

// Get all templates for an institution (auto-provisions defaults if empty)
async function getTemplates(req, res) {
  try {
    const universityId = req.user.userId;
    let templates = await Template.find({ 
      $or: [
        { university: universityId, isActive: true },
        { universityId: 'un03', isActive: true },
        { universityId: 'un02', isActive: true }
      ]
    });

    // If no templates in database, seed default templates from disk
    if (templates.length === 0) {
      const defaultDir = path.join(__dirname, '..', 'templates', 'un03');
      if (fs.existsSync(defaultDir)) {
        const types = [
          { name: 'Semester Marks Card', type: 'marks_card', file: 'marks_card.ejs' },
          { name: 'Transfer Certificate', type: 'transfer', file: 'transfer.ejs' },
          { name: 'Degree Certificate', type: 'grade_card', file: 'grade_card.ejs' },
          { name: 'Migration Certificate', type: 'migration', file: 'migration.ejs' }
        ];

        for (const t of types) {
          const tPath = `templates/un03/${t.file}`;
          if (fs.existsSync(path.join(__dirname, '..', tPath))) {
            const created = new Template({
              templateName: t.name,
              certificateType: t.type,
              university: universityId,
              universityId: 'un03',
              templatePath: tPath,
              isActive: true
            });
            await created.save();
          }
        }
        templates = await Template.find({ isActive: true });
      }
    }

    res.json({ success: true, templates });
  } catch (err) {
    console.error('Get templates error:', err);
    res.status(500).json({ msg: 'Server error retrieving templates', error: err.message });
  }
}

// Issue single certificate with cryptographic SHA-256 hash & blockchain registration
async function issueCertificate(req, res) {
  try {
    if (req.user.role !== 'university' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: Only authorized institutions can issue certificates' });
    }

    const universityId = req.user.userId;
    const { templateId, certificateData, studentEmail } = req.body;

    if (!templateId || !certificateData || !studentEmail) {
      return res.status(400).json({ msg: 'Template ID, certificate data, and student email are required' });
    }

    const university = await User.findById(universityId);
    const univCode = university?.universityDetails?.universityId || 'UN01';
    const univName = university?.universityDetails?.universityName || 'Emertech Academic Institute';

    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ msg: 'Certificate template not found' });
    }

    // 1. Generate unique blockchain ID
    const blockchainId = generateBlockchainId(univCode);

    // 2. Generate QR code pointing to public verification portal
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify?id=${encodeURIComponent(blockchainId)}`;
    const qrDataUri = await generateQRCodeDataURI(verificationUrl);

    // 3. Prepare template rendering payload
    const ejsData = {
      ...certificateData,
      universityName: univName,
      blockchainId,
      qrCodeData: qrDataUri,
      issueDate: new Date().toISOString().slice(0, 10),
      verificationUrl
    };

    // 4. Generate PDF certificate using Puppeteer
    const templatePath = path.join(__dirname, '..', template.templatePath);
    const pdfFileName = `${blockchainId}.pdf`;
    const certDir = path.join(__dirname, '..', 'uploads', 'certificates');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    const pdfPath = path.join(certDir, pdfFileName);

    await renderTemplateToPdf(templatePath, ejsData, pdfPath);

    // 5. Store document & compute SHA-256 hash
    const storageResult = await storeCertificateDocument(pdfPath, pdfFileName);
    const { documentHash, ipfsHash, storageType } = storageResult;

    // 6. Instantiate Certificate in MongoDB
    const certificate = new Certificate({
      blockchainId,
      certificateType: template.certificateType,
      universityId: univCode,
      universityName: univName,
      issuedBy: universityId,
      studentEmail: studentEmail.trim().toLowerCase(),
      studentName: certificateData.studentName || 'Student',
      enrollmentNumber: certificateData.enrollmentNumber || certificateData.registerNo || '',
      registerNo: certificateData.registerNo || '',
      course: certificateData.course || certificateData.program || '',
      program: certificateData.program || certificateData.course || '',
      semester: certificateData.semester || '',
      yearOfGraduation: certificateData.yearOfGraduation ? parseInt(certificateData.yearOfGraduation, 10) : undefined,
      documentHash,
      ipfsHash,
      storageType,
      pdfPath: `uploads/certificates/${pdfFileName}`,
      qrCodeData: qrDataUri,
      templateUsed: templateId,
      certificateData: ejsData,
      status: 'issued',
      verifiedOnChain: false
    });

    // 7. Register on local Hardhat Ethereum Blockchain if configured
    if (process.env.RPC_URL && process.env.ETH_PRIVATE_KEY && process.env.CONTRACT_ADDRESS) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI.abi, wallet);

        console.log(`🔗 Minting certificate ${blockchainId} on-chain with hash ${documentHash}...`);
        const tx = await contract.issueCertificate(blockchainId, documentHash, ipfsHash);
        const receipt = await tx.wait();

        certificate.blockchainTxHash = receipt.transactionHash || tx.hash;
        certificate.blockNumber = receipt.blockNumber;
        certificate.verifiedOnChain = true;
        console.log(`✅ On-chain registration confirmed in block #${receipt.blockNumber} (tx: ${certificate.blockchainTxHash})`);
      } catch (bcErr) {
        console.warn(`⚠️ Blockchain registration warning (${bcErr.message}). Certificate saved in off-chain database.`);
      }
    }

    await certificate.save();

    // 8. Link certificate to student if registered
    const student = await User.findOne({ email: studentEmail.trim().toLowerCase(), role: 'student' });
    if (student) {
      if (!student.issuedCertificates) {
        student.issuedCertificates = [];
      }
      student.issuedCertificates.push(certificate._id);
      await student.save();
    }

    res.status(201).json({ 
      success: true,
      msg: 'Academic certificate issued and registered successfully', 
      certificate: {
        blockchainId: certificate.blockchainId,
        documentHash: certificate.documentHash,
        ipfsHash: certificate.ipfsHash,
        storageType: certificate.storageType,
        verifiedOnChain: certificate.verifiedOnChain,
        blockchainTxHash: certificate.blockchainTxHash,
        pdfUrl: `/api/public/certificate/${certificate.blockchainId}/download`
      }
    });

  } catch (err) {
    console.error('Issue certificate error:', err);
    res.status(500).json({ msg: 'Server error during certificate issuance', error: err.message });
  }
}

// Get all issued certificates for institution
async function getIssuedCertificates(req, res) {
  try {
    const universityId = req.user.userId;
    const { search, certificateType, course, startDate, endDate } = req.query;

    let query = {};
    if (req.user.role === 'university') {
      query.issuedBy = universityId;
    }

    if (search) {
      query.$or = [
        { blockchainId: { $regex: search, $options: 'i' } },
        { registerNo: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } }
      ];
    }

    if (certificateType) {
      query.certificateType = certificateType;
    }

    if (course) {
      query.course = { $regex: course, $options: 'i' };
    }

    if (startDate || endDate) {
      query.dateOfIssue = {};
      if (startDate) query.dateOfIssue.$gte = new Date(startDate);
      if (endDate) query.dateOfIssue.$lte = new Date(endDate);
    }

    const certificates = await Certificate.find(query)
      .populate('templateUsed', 'templateName certificateType')
      .sort({ createdAt: -1 });

    res.json({ success: true, certificates });
  } catch (err) {
    console.error('Get issued certificates error:', err);
    res.status(500).json({ msg: 'Server error retrieving issued certificates', error: err.message });
  }
}

// Revoke an issued certificate (off-chain + on-chain)
async function revokeCertificate(req, res) {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    let query = { _id: certificateId };
    if (req.user.role === 'university') {
      query.issuedBy = userId;
    }

    const certificate = await Certificate.findOne(query);
    if (!certificate) {
      return res.status(404).json({ msg: 'Certificate not found or unauthorized' });
    }

    if (certificate.status === 'revoked') {
      return res.status(400).json({ msg: 'Certificate is already revoked' });
    }

    const revocationReason = reason || 'Revoked by authorized institution administration';
    certificate.status = 'revoked';
    certificate.revocationReason = revocationReason;
    certificate.revokedAt = new Date();
    certificate.revokedBy = req.user.email || userId;

    // Revoke on Blockchain if configured
    if (process.env.RPC_URL && process.env.ETH_PRIVATE_KEY && process.env.CONTRACT_ADDRESS && certificate.verifiedOnChain) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI.abi, wallet);

        console.log(`🔗 Broadcasting on-chain revocation for ${certificate.blockchainId}...`);
        const tx = await contract.revokeCertificate(certificate.blockchainId, revocationReason);
        await tx.wait();
        console.log(`✅ On-chain revocation confirmed for ${certificate.blockchainId}`);
      } catch (bcErr) {
        console.warn(`⚠️ Blockchain revocation warning (${bcErr.message})`);
      }
    }

    await certificate.save();

    res.json({ 
      success: true, 
      msg: `Certificate ${certificate.blockchainId} has been revoked successfully.`,
      status: 'revoked' 
    });
  } catch (err) {
    console.error('Revoke certificate error:', err);
    res.status(500).json({ msg: 'Server error during certificate revocation', error: err.message });
  }
}

// Preview certificate HTML
async function previewCertificate(req, res) {
  try {
    const { templateId, certificateData } = req.body;

    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }

    const university = await User.findById(req.user.userId);
    const univName = university?.universityDetails?.universityName || 'Emertech Academic Institute';

    const tempId = `PREVIEW-${Date.now()}`;
    const qrDataUri = await generateQRCodeDataURI(`http://localhost:3000/verify?id=${tempId}`);

    const ejsData = {
      ...certificateData,
      universityName: univName,
      blockchainId: tempId,
      qrCodeData: qrDataUri,
      issueDate: new Date().toISOString().slice(0, 10),
      verificationUrl: `http://localhost:3000/verify?id=${tempId}`
    };

    const templatePath = path.join(__dirname, '..', template.templatePath);
    const ejs = require('ejs');
    const html = await ejs.renderFile(templatePath, ejsData);

    res.send(html);
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ msg: 'Server error rendering preview', error: err.message });
  }
}

module.exports = { 
  getUniversityProfile,
  uploadTemplate,
  getTemplates,
  issueCertificate,
  getIssuedCertificates,
  revokeCertificate,
  previewCertificate
};
