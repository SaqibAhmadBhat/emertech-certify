const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

/**
 * Intelligent text extraction and field identification from certificate files (PDF or Images)
 * Uses local, zero-cost OCR (Tesseract.js) and PDF text parsing.
 */
async function extractCertificateData(filePath, mimeType) {
  let extractedText = '';
  let extractionMethod = 'unknown';

  const isPdf = mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text || '';
      if (extractedText.trim().length > 0) {
        extractionMethod = 'PDF Text Stream Parser';
      }
    } catch (pdfErr) {
      console.warn('PDF stream parse warning:', pdfErr.message);
    }

    // If stream parsing was sparse or encountered raw fonts, extract text tokens from PDF content streams
    if (!extractedText || extractedText.trim().length < 20) {
      try {
        const rawContent = fs.readFileSync(filePath, 'latin1');
        const textMatches = rawContent.match(/\(([^()]+)\)\s*Tj/g) || rawContent.match(/\[([^\]]+)\]\s*TJ/g);
        if (textMatches && textMatches.length > 0) {
          const parsedLines = textMatches.map(m => m.replace(/[\(\)\[\]]|Tj|TJ/g, '').trim()).filter(Boolean);
          if (parsedLines.length > 0) {
            extractedText = parsedLines.join('\n');
            extractionMethod = 'PDF Stream Tokenizer';
          }
        }
      } catch (streamErr) {
        console.warn('PDF token extraction warning:', streamErr.message);
      }
    }
  } else {
    // Non-PDF documents (PNG, JPEG, TIFF, WebP, etc.) use Tesseract OCR
    try {
      console.log('Running local Tesseract OCR engine on image document...');
      const result = await Tesseract.recognize(filePath, 'eng', {
        logger: () => {}
      });
      extractedText = result.data.text || '';
      extractionMethod = 'Tesseract.js Neural OCR Engine';
    } catch (ocrErr) {
      console.error('Tesseract OCR error:', ocrErr.message);
      if (!extractedText) {
        throw new Error(`OCR processing failed: ${ocrErr.message}`);
      }
    }
  }

  // Heuristic field identification
  const fields = parseCertificateFields(extractedText);

  return {
    rawText: extractedText.trim(),
    extractionMethod,
    fields,
    disclaimer: 'OCR-assisted extraction provides suggestions for administrative convenience. Authorized personnel must verify all values prior to final certificate issuance.'
  };
}

/**
 * Heuristic regex pattern matching for academic certificates
 */
function parseCertificateFields(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let studentName = null;
  let institutionName = null;
  let registerNo = null;
  let course = null;
  let issueDate = null;
  let semester = null;

  // 1. Institution Name detection
  for (const line of lines.slice(0, 10)) {
    if (/(?:university|c[oa]llege|institute|academy|school of)/i.test(line)) {
      institutionName = line.replace(/^[^\w]+|[^\w]+$/g, '');
      break;
    }
  }

  // 2. Student Name detection (look for recipient line after certification phrase)
  for (let i = 0; i < lines.length; i++) {
    if (/(?:this\s*is\s*to\s*certi|certi\w*\s+that|awarded\s+to|conferred\s+upon|presented\s+to)/i.test(lines[i])) {
      if (i + 1 < lines.length && /^[A-Z][a-zA-Z\s\.]+$/.test(lines[i+1]) && lines[i+1].split(' ').length >= 2) {
        studentName = lines[i+1].trim();
        break;
      }
    }
  }

  if (!studentName) {
    const namePatterns = [
      /(?:certif\w*\s+that|awarded to|conferred upon|this is to certif\w* that)\s+(?:mr\.|ms\.|mrs\.)?\s*([A-Z][a-zA-Z\s\.]+?)(?:[\,\n\.]|\s+has|\s+son|\s+daughter|\s+bearing)/i,
      /(?:student\s*name|name of student|candidate\s*name)\s*[:\-]\s*([A-Z][a-zA-Z\s\.]+)/i,
      /(?:name)\s*[:\-]\s*([A-Z][a-zA-Z\s\.]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        studentName = match[1].trim();
        break;
      }
    }
  }

  // 3. Register / Enrollment Number
  const regPatterns = [
    /(?:register|reg|enrollment|roll)\s*[nN][\.\s]*[oa0\.]?\s*[:\-\s]?\s*([A-Z0-9\/\-]+)/i,
    /(?:enrollment\s*(?:no|number)|roll\s*no\.?|student\s*id)\s*[:\-]?\s*([A-Z0-9\/\-]+)/i,
    /\b([0-9]{8,16})\b/
  ];

  for (const pattern of regPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      registerNo = match[1].trim();
      break;
    }
  }

  // 4. Course / Degree Program
  const coursePatterns = [
    /(?:Bachelor of\s+[A-Za-z\s]+|Master of\s+[A-Za-z\s]+|Doctor of\s+[A-Za-z\s]+)/i,
    /\b(B\.?E\.?|B\.?Tech\.?|M\.?E\.?|M\.?Tech\.?)\s+(?:in\s+)?([A-Za-z\s]+)/i,
    /\b(B\.?Sc\.?|M\.?Sc\.?|BCA|MCA|BBA|MBA)\b(?:\s+(?:in\s+)?([A-Za-z\s]+))?/i,
    /(?:degree of|program\s*[:\-])\s*([A-Za-z\s\(\)]+)/i
  ];

  for (const pattern of coursePatterns) {
    const match = text.match(pattern);
    if (match) {
      course = (match[2] ? match[1] + ' in ' + match[2] : match[0]).split('\n')[0].trim();
      break;
    }
  }

  // 5. Issue Date
  const datePatterns = [
    /\b([0-9]{4}[-.\/][0-9]{2}[-.\/][0-9]{2})\b/,
    /(?:date of issue|issue date|date)\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
    /\b([0-9]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{4})\b/i
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      issueDate = match[1].trim();
      break;
    }
  }

  // 6. Semester
  const semMatch = text.match(/(?:semester|sem)\s*[:\-]?\s*([I|V|X\d]+)/i);
  if (semMatch && semMatch[1]) {
    semester = semMatch[1].trim();
  }

  return {
    studentName,
    institutionName,
    registerNo,
    course,
    issueDate,
    semester
  };
}

module.exports = {
  extractCertificateData
};

