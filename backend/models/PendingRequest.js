const mongoose = require('mongoose');

const PendingRequestSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'university' },
  
  universityDetails: {
    universityName: { type: String, required: true },
    contactPersonName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    officialAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    accreditationId: { type: String, required: true },
    coursesOffered: [String],
    reasonForRegistration: String
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  reviewedBy: { type: String },
  reviewDate: Date,
  rejectionReason: String,
  universityId: String
  
}, { timestamps: true });

module.exports = mongoose.model('PendingRequest', PendingRequestSchema);