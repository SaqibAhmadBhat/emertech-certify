const Tesseract = require('tesseract.js');

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

      // Student identifier matching (e.g. STU-2026-0042, 950020104001, Register No: ...)
      const idMatch = line.match(/(?:Student\s*(?:Identifier|ID|No)|Register(?:ation)?\s*(?:No|Identifier|ID)?|Enrollment\s*(?:No|ID)?)\s*[:\s-]\s*([A-Za-z0-9_-]{6,24})/i);
      if (idMatch && !result.detectedStudentId) {
        result.detectedStudentId = idMatch[1].trim();
      }

      // Name detection
      if (line.match(/(?:confers\s+upon|certif(?:y|ies)\s+that|awarded\s+to)/i) && i + 1 < lines.length) {
        result.detectedStudentName = lines[i + 1].replace(/[^a-zA-Z\s.]/g, '').trim();
      }

      // Degree matching
      if (line.match(/^(?:Bachelor|Master|Doctor|Doctorate|B\.E|B\.Tech|B\.S|M\.S)/i) && !result.detectedDegree) {
        result.detectedDegree = line;
      }

      // Institution matching
      if (line.match(/(?:College|University|Institute|Academy|School\s+of)/i) && !result.detectedInstitution) {
        result.detectedInstitution = line;
      }
    }

    return result;
  }
}

module.exports = OcrService;
