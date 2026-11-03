const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Common fields
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'university', 'student'], required: true },
  
  // Student-specific fields
  studentDetails: {
    fullName: String,
    dateOfBirth: Date,
    program: { type: String, enum: ['ug', 'pg'] },
    
    // UG/Current degree details
    enrollmentNumber: String,
    universityName: String,
    yearOfAdmission: Number,
    yearOfGraduation: Number,
    
    // PG specific additional fields (for students who did PG after UG)
    pgEnrollmentNumber: String,
    pgUniversityName: String,
    pgYearOfAdmission: Number,
    pgYearOfGraduation: Number
  },
  
  // University-specific fields
  universityDetails: {
    universityName: String,
    universityId: String, 
    contactPersonName: String,
    contactNumber: String,
    officialAddress: String,
    city: String,
    state: String,
    country: String,
    accreditationId: String,
    coursesOffered: [String], // Array of courses
    reasonForRegistration: String,
    approved: { type: Boolean, default: false },
    approvedBy: { type:String},
    approvalDate: Date,
    rejectionReason: String
  },
  
  // Certificate references
  issuedCertificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }]
}, { timestamps: true });

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'universityDetails.approved': 1 });

module.exports = mongoose.model('User', UserSchema);