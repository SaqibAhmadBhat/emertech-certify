const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'STUDENT'],
    default: 'STUDENT'
  },
  institutionCode: {
    type: String,
    uppercase: true,
    trim: true
  },
  studentIdentifier: {
    type: String,
    trim: true
  },
  walletAddress: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Atomic database guard: exactly ONE Super Administrator can ever exist in the database
userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: 'SUPER_ADMIN' } }
);

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  return bcrypt.hash(plainPassword, 10);
};

module.exports = mongoose.model('User', userSchema);
