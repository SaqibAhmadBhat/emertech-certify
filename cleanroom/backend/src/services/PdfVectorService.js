const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

class PdfVectorService {
  /**
   * Compiles an original vector PDF academic certificate.
   */
  static async generateCertificatePdf(certData) {
    // Standard A4 Landscape: 841.89 x 595.28 points
    const doc = await PDFDocument.create();
    
    // Embed Document Metadata
    doc.setTitle(certData.certificateId || 'EMERTECH-CERT');
    doc.setSubject(certData.certHash || '');
    doc.setAuthor(certData.institutionName || 'Government College of Engineering, Tirunelveli');
    doc.setKeywords([certData.certificateId || '', certData.certHash || '', 'Emertech Certify']);
    doc.setProducer('Emertech Certify Cryptographic Engine v2.0');

    const page = doc.addPage([842, 595]);
    const { width, height } = page.getSize();

    // Load standard fonts
    const fontTimes = await doc.embedFont(StandardFonts.TimesRoman);
    const fontTimesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const fontHelvetica = await doc.embedFont(StandardFonts.Helvetica);
    const fontHelveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontCourier = await doc.embedFont(StandardFonts.Courier);

    // Color definitions
    const navy = rgb(11/255, 19/255, 43/255);
    const gold = rgb(217/255, 119/255, 6/255);
    const slate = rgb(71/255, 85/255, 105/255);
    const lightBg = rgb(250/255, 250/255, 252/255);

    // Decorative Security Borders
    page.drawRectangle({
      x: 18,
      y: 18,
      width: width - 36,
      height: height - 36,
      borderColor: gold,
      borderWidth: 3,
      color: lightBg
    });

    page.drawRectangle({
      x: 26,
      y: 26,
      width: width - 52,
      height: height - 52,
      borderColor: navy,
      borderWidth: 1
    });

    // Header Emblem / Title
    const institutionName = (certData.institutionName || 'GOVERNMENT COLLEGE OF ENGINEERING, TIRUNELVELI').toUpperCase();
    const instWidth = fontTimesBold.widthOfTextAtSize(institutionName, 22);
    page.drawText(institutionName, {
      x: (width - instWidth) / 2,
      y: height - 70,
      size: 22,
      font: fontTimesBold,
      color: navy
    });

    const subTitle = "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING";
    const subWidth = fontHelveticaBold.widthOfTextAtSize(subTitle, 11);
    page.drawText(subTitle, {
      x: (width - subWidth) / 2,
      y: height - 92,
      size: 11,
      font: fontHelveticaBold,
      color: gold
    });

    // Decorative divider
    page.drawLine({
      start: { x: 120, y: height - 105 },
      end: { x: width - 120, y: height - 105 },
      thickness: 1.5,
      color: gold
    });

    // Main Certificate Header
    const certTitle = "DEGREE OF BACHELOR OF ENGINEERING";
    const certTitleWidth = fontTimesBold.widthOfTextAtSize(certTitle, 18);
    page.drawText(certTitle, {
      x: (width - certTitleWidth) / 2,
      y: height - 145,
      size: 18,
      font: fontTimesBold,
      color: navy
    });

    // Conferral text
    const conferText = "The Academic Council hereby confers upon";
    const conferWidth = fontTimes.widthOfTextAtSize(conferText, 14);
    page.drawText(conferText, {
      x: (width - conferWidth) / 2,
      y: height - 180,
      size: 14,
      font: fontTimes,
      color: slate
    });

    // Student Name
    const studentName = (certData.studentName || 'SAQIB AHMAD BHAT').toUpperCase();
    const studentWidth = fontTimesBold.widthOfTextAtSize(studentName, 26);
    page.drawText(studentName, {
      x: (width - studentWidth) / 2,
      y: height - 225,
      size: 26,
      font: fontTimesBold,
      color: navy
    });

    // Student Register Number
    const regText = `Registration Identifier: ${certData.studentIdentifier || '950020104001'}`;
    const regWidth = fontHelvetica.widthOfTextAtSize(regText, 12);
    page.drawText(regText, {
      x: (width - regWidth) / 2,
      y: height - 250,
      size: 12,
      font: fontHelvetica,
      color: gold
    });

    // Program and Distinction
    const programText = `having completed the curriculum and fulfilled all requirements in`;
    const progWidth = fontTimes.widthOfTextAtSize(programText, 13);
    page.drawText(programText, {
      x: (width - progWidth) / 2,
      y: height - 285,
      size: 13,
      font: fontTimes,
      color: slate
    });

    const majorText = certData.majorProgram || 'Computer Science and Engineering';
    const majorWidth = fontTimesBold.widthOfTextAtSize(majorText, 16);
    page.drawText(majorText, {
      x: (width - majorWidth) / 2,
      y: height - 310,
      size: 16,
      font: fontTimesBold,
      color: navy
    });

    const distinctionText = `Classification: ${certData.gradeOrDistinction || 'First Class with Distinction'}`;
    const distWidth = fontHelveticaBold.widthOfTextAtSize(distinctionText, 13);
    page.drawText(distinctionText, {
      x: (width - distWidth) / 2,
      y: height - 335,
      size: 13,
      font: fontHelveticaBold,
      color: gold
    });

    // Generate Verification QR Code
    const verifyUrl = certData.verificationUrl || `http://localhost:3000/verify?hash=${certData.certHash}`;
    const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 140
    });
    const qrImage = await doc.embedPng(qrPngBuffer);

    // Draw QR Code on bottom right
    page.drawImage(qrImage, {
      x: width - 180,
      y: 55,
      width: 110,
      height: 110
    });

    page.drawText("SCAN TO VERIFY", {
      x: width - 168,
      y: 40,
      size: 8,
      font: fontHelveticaBold,
      color: navy
    });

    // Signatures / Authorities on bottom left
    page.drawText("CONTROLLER OF EXAMINATIONS", {
      x: 70,
      y: 75,
      size: 10,
      font: fontHelveticaBold,
      color: navy
    });
    page.drawLine({
      start: { x: 70, y: 95 },
      end: { x: 230, y: 95 },
      thickness: 1,
      color: slate
    });

    page.drawText("PRINCIPAL & DEAN", {
      x: 280,
      y: 75,
      size: 10,
      font: fontHelveticaBold,
      color: navy
    });
    page.drawLine({
      start: { x: 280, y: 95 },
      end: { x: 420, y: 95 },
      thickness: 1,
      color: slate
    });

    // Issuance Metadata & Cryptographic Footer
    const issueDateStr = `Issue Date: ${certData.graduationDate || '2026-05-15'}   |   Certificate ID: ${certData.certificateId}`;
    page.drawText(issueDateStr, {
      x: 70,
      y: 42,
      size: 9,
      font: fontHelvetica,
      color: slate
    });

    const hashFooter = `SHA-256 HASH: ${certData.certHash || ''}`;
    page.drawText(hashFooter, {
      x: 70,
      y: 28,
      size: 7.5,
      font: fontCourier,
      color: slate
    });

    // Return compiled PDF binary
    return Buffer.from(await doc.save());
  }
}

module.exports = PdfVectorService;
