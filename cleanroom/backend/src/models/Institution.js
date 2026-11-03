const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  institutionCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  officialDomain: {
    type: String,
    required: true,
    trim: true
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'AUTHORIZED', 'SUSPENDED', 'REVOKED'],
    default: 'PENDING'
  },
  onChainAuthorized: {
    type: Boolean,
    default: false
  },
  authorizationTxHash: {
    type: String,
    default: null
  },
  onChainStatus: {
    type: String,
    enum: ['UNREGISTERED', 'PENDING', 'AUTHORIZED', 'SUSPENDED', 'REVOKED'],
    default: 'UNREGISTERED'
  },
  encryptedPrivateKey: {
    type: String,
    default: null
  },
  keyVaultIv: {
    type: String,
    default: null
  },
  keyVaultTag: {
    type: String,
    default: null
  },
  keyDerivationSalt: {
    type: String,
    default: null
  },
  keyVersion: {
    type: Number,
    default: 1
  },
  accreditedBy: {
    type: String,
    default: 'National Accreditation Board'
  },
  approvedByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Institution', institutionSchema);
