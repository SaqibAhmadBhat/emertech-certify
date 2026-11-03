const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

/**
 * Renders an EJS academic certificate template with dynamic data to an A4 PDF document
 */
async function renderTemplateToPdf(templateHtmlPath, data, outputPath) {
  // 1. Render template to HTML
  const html = await ejs.renderFile(templateHtmlPath, data, {});

  // Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 2. Launch Puppeteer with modern 'new' headless mode and system Chrome detection
  let browser = null;
  try {
    const systemChromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser'
    ];
    const executablePath = systemChromePaths.find(p => fs.existsSync(p));

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ];

    const launchOptions = {
      headless: 'new',
      args: launchArgs
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
    });

    return outputPath;
  } catch (err) {
    console.error('Puppeteer rendering error:', err.message);
    
    // Fallback: If Chromium fails, generate a clean fallback PDF using pdf-lib
    try {
      const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const courier = await pdfDoc.embedFont(StandardFonts.Courier);

      const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
      const { width, height } = page.getSize();

      page.drawRectangle({
        x: 30,
        y: 30,
        width: width - 60,
        height: height - 60,
        borderWidth: 2,
        borderColor: rgb(0.06, 0.13, 0.28)
      });

      page.drawText(data.universityName || 'Academic Institution', {
        x: 60,
        y: height - 80,
        size: 20,
        font: timesBold,
        color: rgb(0.06, 0.13, 0.28)
      });

      page.drawText('OFFICIAL ACADEMIC CERTIFICATE', {
        x: 60,
        y: height - 110,
        size: 14,
        font: timesBold,
        color: rgb(0.3, 0.3, 0.3)
      });

      page.drawText(`Student Name: ${data.studentName || 'N/A'}`, {
        x: 60,
        y: height - 160,
        size: 12,
        font: timesRoman
      });

      page.drawText(`Register / Roll No: ${data.registerNo || data.enrollmentNumber || 'N/A'}`, {
        x: 60,
        y: height - 185,
        size: 12,
        font: timesRoman
      });

      page.drawText(`Course / Degree: ${data.course || data.program || 'N/A'}`, {
        x: 60,
        y: height - 210,
        size: 12,
        font: timesRoman
      });

      page.drawText(`Date of Issue: ${data.issueDate || new Date().toISOString().slice(0, 10)}`, {
        x: 60,
        y: height - 235,
        size: 12,
        font: timesRoman
      });

      page.drawText(`Blockchain ID: ${data.blockchainId || 'N/A'}`, {
        x: 60,
        y: height - 280,
        size: 11,
        font: courier,
        color: rgb(0.2, 0.2, 0.6)
      });

      page.drawText('Tamper-Evident Record Verified on Ethereum Smart Contract', {
        x: 60,
        y: height - 300,
        size: 9,
        font: timesRoman,
        color: rgb(0.4, 0.4, 0.4)
      });

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);
      console.log('✅ Fallback PDF generated successfully using pdf-lib');
      return outputPath;
    } catch (fallbackErr) {
      throw new Error(`PDF generation failed: ${err.message} (Fallback failed: ${fallbackErr.message})`);
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        // ignore close error
      }
    }
  }
}

module.exports = { renderTemplateToPdf };
