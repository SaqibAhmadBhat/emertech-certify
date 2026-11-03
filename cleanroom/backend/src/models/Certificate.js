const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  certHash: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  fileHash: {
    type: String,
    lowercase: true,
    trim: true
  },
  canonicalString: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  studentIdentifier: {
    type: String,
    required: true,
    trim: true
  },
  degreeTitle: {
    type: String,
    required: true,
    trim: true
  },
  majorProgram: {
    type: String,
    required: true,
    trim: true
  },
  graduationDate: {
    type: String,
    required: true
  },
  gradeOrDistinction: {
    type: String,
    default: 'First Class with Distinction'
  },
  institutionCode: {
    type: String,
    required: true,
    uppercase: true
  },
  institutionName: {
    type: String,
    required: true
  },
  issuerWalletAddress: {
    type: String,
    required: true
  },
  ipfsCID: {
    type: String,
    default: ''
  },
  storagePath: {
    type: String,
    default: ''
  },
  blockchainTxHash: {
    type: String,
    default: ''
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revocationReason: {
    type: String,
    default: ''
  },
  revokedAt: {
    type: Date
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
