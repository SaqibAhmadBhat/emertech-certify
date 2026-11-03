const mongoose = require('mongoose');

const studentEnrollmentSchema = new mongoose.Schema({
  institutionCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  studentIdentifier: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  enrollmentToken: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isClaimed: {
    type: Boolean,
    default: false
  },
  claimedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

studentEnrollmentSchema.index({ institutionCode: 1, studentIdentifier: 1 }, { unique: true });

module.exports = mongoose.model('StudentEnrollment', studentEnrollmentSchema);
