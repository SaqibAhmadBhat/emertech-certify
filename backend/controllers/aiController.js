const fs = require('fs');
const { extractCertificateData } = require('../utils/aiOcr');

/**
 * AI-Assisted OCR endpoint for extracting academic certificate fields
 * Used during certificate preparation and draft issuance
 */
async function extractFromDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      msg: 'No certificate file uploaded. Please upload a PDF or image file.'
    });
  }

  const filePath = req.file.path;

  try {
    const result = await extractCertificateData(filePath, req.file.mimetype);

    // Clean up temporary file
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // ignore unlink error
      }
    }

    res.json({
      success: true,
      msg: 'Information extracted successfully using local OCR engine',
      ...result
    });
  } catch (error) {
    console.error('OCR Extraction error:', error);

    // Clean up temporary file
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // ignore unlink error
      }
    }

    res.status(500).json({
      success: false,
      msg: 'Failed to extract certificate details: ' + error.message
    });
  }
}

module.exports = {
  extractFromDocument
};

