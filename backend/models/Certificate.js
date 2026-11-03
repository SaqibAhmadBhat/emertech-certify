const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  blockchainId: { type: String, required: true, unique: true }, // UN01-CERT-123456-2026
  certificateType: { 
    type: String, 
    enum: ['marks_card', 'transfer', 'migration', 'grade_card'],
    required: true 
  },
  
  // University / Institution details
  universityId: { type: String, required: true },
  universityName: { type: String, required: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Student details
  studentEmail: { type: String, required: true },
  studentName: { type: String, required: true },
  enrollmentNumber: { type: String },
  registerNo: { type: String },
  
  // Certificate details
  course: { type: String },
  program: { type: String },
  semester: { type: String },
  yearOfGraduation: { type: Number },
  dateOfIssue: { type: Date, default: Date.now },
  
  // Storage & Cryptographic details
  documentHash: { type: String, required: true }, // SHA-256 hash (0x...) of the generated PDF
  ipfsHash: { type: String, required: true },     // IPFS CID or local decentralized fallback URI
  storageType: { type: String, enum: ['ipfs', 'local'], default: 'local' },
  pdfPath: { type: String, required: true },
  qrCodeData: { type: String },                   // QR data URI
  
  // Template reference
  templateUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  
  // Blockchain details
  blockchainTxHash: { type: String },
  blockNumber: { type: Number },
  verifiedOnChain: { type: Boolean, default: false },
  
  // Dynamic certificate data (stores all form fields for rendering)
  certificateData: { type: mongoose.Schema.Types.Mixed },
  
  // Status & Revocation tracking
  status: { 
    type: String, 
    enum: ['pending', 'issued', 'revoked'], 
    default: 'issued' 
  },
  revocationReason: { type: String, default: null },
  revokedAt: { type: Date, default: null },
  revokedBy: { type: String, default: null },
  
  // Email tracking
  emailSent: { type: Boolean, default: false },
  emailSentAt: Date
  
}, { timestamps: true });

// Pre-save validation
CertificateSchema.pre('save', function(next) {
  if (!this.blockchainId) {
    return next(new Error('Blockchain ID is required and cannot be null'));
  }
  if (!this.documentHash) {
    return next(new Error('Document SHA-256 hash is required for tamper-evident verification'));
  }
  next();
});

// Indexes for fast lookup
CertificateSchema.index({ blockchainId: 1 }, { unique: true });
CertificateSchema.index({ documentHash: 1 });
CertificateSchema.index({ studentEmail: 1 });
CertificateSchema.index({ universityId: 1 });
CertificateSchema.index({ registerNo: 1 });
CertificateSchema.index({ enrollmentNumber: 1 });
CertificateSchema.index({ certificateType: 1 });
CertificateSchema.index({ status: 1 });

// Helper methods
CertificateSchema.methods.isValid = function() {
  return this.status === 'issued';
};

CertificateSchema.methods.isRevoked = function() {
  return this.status === 'revoked';
};

CertificateSchema.statics.findByBlockchainId = function(blockchainId) {
  return this.findOne({ blockchainId: blockchainId.trim() });
};

CertificateSchema.statics.findByDocumentHash = function(hash) {
  const normalized = hash.trim().toLowerCase();
  return this.findOne({ 
    documentHash: { $regex: new RegExp(`^${normalized}$`, 'i') } 
  });
};

CertificateSchema.statics.findByStudentEmail = function(email) {
  return this.find({ studentEmail: email }).sort({ dateOfIssue: -1 });
};

module.exports = mongoose.model('Certificate', CertificateSchema);
