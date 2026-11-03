const Tesseract = require('tesseract.js');
const fs = require('fs');

class OcrService {
  /**
   * Performs optical character recognition on an image buffer or file path.
   */
  static async extractTextFromImage(imageInput) {
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageInput,
        'eng',
        {
          logger: () => {} // Suppress verbose worker logs
        }
      );
      return { success: true, text: text.trim() };
    } catch (err) {
      console.error('[OCR] Extraction error:', err.message);
      return { success: false, text: '', error: err.message };
    }
  }

  /**
   * Normalizes and parses common academic credential fields from extracted OCR text.
   */
  static parseAcademicEntities(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const result = {
      detectedStudentName: '',
      detectedStudentId: '',
      detectedDegree: '',
      detectedInstitution: '',
      rawTextSnippet: rawText.substring(0, 300)
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Student identifier matching (e.g. 950020104001 or Register No: ...)
      const idMatch = line.match(/(?:Register(?:ation)?\s*(?:No|Identifier|ID)?[:\s]*)(\w{8,16})/i);
      if (idMatch && !result.detectedStudentId) {
        result.detectedStudentId = idMatch[1];
      }

      // Name detection
      if (line.match(/(?:confers\s+upon|certif(?:y|ies)\s+that|awarded\s+to)/i) && i + 1 < lines.length) {
        result.detectedStudentName = lines[i + 1].replace(/[^a-zA-Z\s]/g, '').trim();
      }

      // Degree matching
      if (line.match(/(?:Bachelor|Master|Doctor|B\.E|B\.Tech|Degree\s+of)/i) && !result.detectedDegree) {
        result.detectedDegree = line;
      }

      // Institution matching
      if (line.match(/(?:College|University|Institute|Engineering)/i) && !result.detectedInstitution) {
        result.detectedInstitution = line;
      }
    }

    return result;
  }
}

module.exports = OcrService;
