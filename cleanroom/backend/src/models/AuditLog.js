const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['ISSUANCE', 'VERIFICATION_SUCCESS', 'TAMPER_DETECTED', 'REVOCATION', 'LOGIN', 'SECURITY_ALERT'],
    required: true
  },
  certHash: {
    type: String,
    lowercase: true,
    trim: true
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actorEmail: String,
  actorRole: String,
  clientIp: String,
  userAgent: String,
  diagnosticDetails: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
