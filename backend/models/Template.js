const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  templateName: { type: String, required: true },
  certificateType: { 
    type: String, 
    enum: ['marks_card', 'transfer', 'migration', 'grade_card'],
    required: true 
  },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  universityId: { type: String, required: true }, // e.g., "UN01"
  templatePath: { type: String, required: true }, // e.g., "templates/UN01/marks_card.ejs"
  placeholders: [{
    name: String, // e.g., "studentName", "registerNo"
    label: String, // Display label
    type: { type: String, enum: ['text', 'number', 'date', 'array'], default: 'text' },
    required: { type: Boolean, default: true }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for faster queries
TemplateSchema.index({ university: 1, certificateType: 1 });
TemplateSchema.index({ universityId: 1 });

module.exports = mongoose.model('Template', TemplateSchema);