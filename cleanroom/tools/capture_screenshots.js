const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

const puppeteer = require('../../backend/node_modules/puppeteer');
const app = require('../backend/src/app');
const { connectDatabase, disconnectDatabase } = require('../backend/src/config/db');
const User = require('../backend/src/models/User');
const Institution = require('../backend/src/models/Institution');
const Certificate = require('../backend/src/models/Certificate');
const AuditLog = require('../backend/src/models/AuditLog');
const StudentEnrollment = require('../backend/src/models/StudentEnrollment');
const PdfVectorService = require('../backend/src/services/PdfVectorService');
const jwt = require('jsonwebtoken');
const config = require('../backend/src/config/env');

const SCREENSHOT_DIR = path.resolve(__dirname, '../../docs/screenshots');
const CLEANROOM_SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

async function seedData() {
  await User.deleteMany({});
  await Institution.deleteMany({});
  await Certificate.deleteMany({});
  await AuditLog.deleteMany({});
  await StudentEnrollment.deleteMany({});

  const superAdmin = await User.create({
    fullName: 'Lead Governance Architect',
    email: 'governance.admin@emertech-test.internal',
    passwordHash: await User.hashPassword('SuperSecure2026!Admin'),
    role: 'SUPER_ADMIN',
    isActive: true
  });

  const institution = await Institution.create({
    institutionCode: 'AIT',
    name: 'Apex Institute of Technology',
    officialDomain: 'apex.edu.test',
    contactEmail: 'contact@apex.edu.test',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    status: 'AUTHORIZED',
    onChainAuthorized: true,
    onChainStatus: 'AUTHORIZED',
    authorizationTxHash: '0x3a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
    approvedAt: new Date(),
    approvedByAdmin: superAdmin._id
  });

  const instAdmin = await User.create({
    fullName: 'Dr. Evelyn Reed, Dean of Academic Affairs',
    email: 'dean.ait@apex.edu.test',
    passwordHash: await User.hashPassword('DeanPassword2026!'),
    role: 'INSTITUTION_ADMIN',
    institutionCode: 'AIT',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    isActive: true
  });

  const rawToken = 'ENR-A1B2C3D4E5F60718';
  const enrollment = await StudentEnrollment.create({
    institutionCode: 'AIT',
    studentIdentifier: 'STU-2026-0042',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav.sharma@apex.edu.test',
    enrollmentTokenHash: StudentEnrollment.hashToken(rawToken),
    isClaimed: true,
    claimedAt: new Date()
  });

  const student = await User.create({
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@apex.edu.test',
    passwordHash: await User.hashPassword('StudentPassword2026!'),
    role: 'STUDENT',
    institutionCode: 'AIT',
    studentIdentifier: 'STU-2026-0042',
    isActive: true
  });
  enrollment.claimedByUserId = student._id;
  await enrollment.save();

  const certData = {
    certificateId: 'AIT-2026-CS-0042',
    certHash: '0xbf99de869e6954bc033bfd547dd056b6069959202ddbfd2bb122ef1e42d36196',
    canonicalString: 'AIT|STU-2026-0042|Aarav Sharma|Bachelor of Engineering in Computer Science and Engineering|Computer Science and Distributed Systems|2026-06-15|First Class with Distinction',
    studentIdentifier: 'STU-2026-0042',
    studentName: 'Aarav Sharma',
    degreeTitle: 'Bachelor of Engineering in Computer Science and Engineering',
    majorProgram: 'Computer Science and Distributed Systems',
    graduationDate: '2026-06-15',
    gradeOrDistinction: 'First Class with Distinction (CGPA: 9.42 / 10.0)',
    institutionCode: 'AIT',
    institutionName: 'Apex Institute of Technology',
    issuerWalletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    onChainIssuerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    blockchainTxHash: '0xedfe3c15f59cf5a26e038a412ba9b69240f6f1b9a5795eade2f64e5dd6eb6dd1',
    onChainAnchored: true,
    isRevoked: false,
    ipfsCID: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    storagePath: path.resolve(__dirname, '../backend/storage/certificates/demo-certificate.pdf')
  };

  const pdfBuffer = await PdfVectorService.generateCertificatePdf(certData);
  fs.mkdirSync(path.dirname(certData.storagePath), { recursive: true });
  fs.writeFileSync(certData.storagePath, pdfBuffer);

  const cert = await Certificate.create(certData);

  const studentToken = jwt.sign(
    { id: student._id, email: student.email, role: student.role, institutionCode: student.institutionCode, studentIdentifier: student.studentIdentifier },
    config.jwtSecret,
    { expiresIn: '2h' }
  );

  const instToken = jwt.sign(
    { id: instAdmin._id, email: instAdmin.email, role: instAdmin.role, institutionCode: instAdmin.institutionCode, walletAddress: instAdmin.walletAddress },
    config.jwtSecret,
    { expiresIn: '2h' }
  );

  const adminToken = jwt.sign(
    { id: superAdmin._id, email: superAdmin.email, role: superAdmin.role },
    config.jwtSecret,
    { expiresIn: '2h' }
  );

  return { superAdmin, instAdmin, student, cert, studentToken, instToken, adminToken };
}

function startStaticServer(buildPath, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';

    let filePath = path.join(buildPath, reqUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(buildPath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function run() {
  console.log('🚀 Starting screenshot capture engine...');
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(CLEANROOM_SCREENSHOT_DIR, { recursive: true });

  await connectDatabase();
  const tokens = await seedData();
  console.log('✅ Synthetic demonstration data seeded.');

  const backendServer = http.createServer(app);
  await new Promise((resolve) => backendServer.listen(5001, resolve));
  console.log('✅ Backend listening on port 5001.');

  const frontendBuildPath = path.resolve(__dirname, '../frontend/build');
  const frontendServer = await startStaticServer(frontendBuildPath, 3000);
  console.log('✅ Frontend static server listening on port 3000.');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  async function snap(filename, waitMs = 1000) {
    await new Promise((r) => setTimeout(r, waitMs));
    const p1 = path.join(SCREENSHOT_DIR, filename);
    const p2 = path.join(CLEANROOM_SCREENSHOT_DIR, filename);
    await page.screenshot({ path: p1 });
    fs.copyFileSync(p1, p2);
    console.log(`📸 Saved: ${filename}`);
  }

  // 1. Landing Page
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await snap('01-landing-page.png', 1000);

  // 2. Login Page
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await snap('02-login-page.png', 800);

  // 3. Student Dashboard
  await page.evaluate((tok, usr) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(usr));
  }, tokens.studentToken, {
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@apex.edu.test',
    role: 'STUDENT',
    institutionCode: 'AIT',
    studentIdentifier: 'STU-2026-0042'
  });
  await page.goto('http://localhost:3000/student', { waitUntil: 'networkidle0' });
  await snap('03-student-dashboard.png', 1500);

  // 4. Institution Dashboard
  await page.evaluate((tok, usr) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(usr));
  }, tokens.instToken, {
    fullName: 'Dr. Evelyn Reed',
    email: 'dean.ait@apex.edu.test',
    role: 'INSTITUTION_ADMIN',
    institutionCode: 'AIT'
  });
  await page.goto('http://localhost:3000/institution', { waitUntil: 'networkidle0' });
  await snap('04-institution-dashboard.png', 1500);

  // 6. Certificate Generation Page (Scrolled to issuance form on Institution Dashboard)
  await page.evaluate(() => {
    const el = document.querySelector('form');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
  await snap('06-certificate-generation.png', 1000);

  // 5. Super Admin Dashboard
  await page.evaluate((tok, usr) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(usr));
  }, tokens.adminToken, {
    fullName: 'Lead Governance Architect',
    email: 'governance.admin@emertech-test.internal',
    role: 'SUPER_ADMIN'
  });
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await snap('05-admin-dashboard.png', 1500);

  // Clear auth for public verification
  await page.evaluate(() => {
    localStorage.clear();
  });

  // 8. Public Verification Page
  await page.goto('http://localhost:3000/verify', { waitUntil: 'networkidle0' });
  await snap('08-public-verification-page.png', 1000);

  // 9. Successful Certificate Verification
  await page.goto('http://localhost:3000/verify?hash=0xbf99de869e6954bc033bfd547dd056b6069959202ddbfd2bb122ef1e42d36196', { waitUntil: 'networkidle0' });
  await snap('09-successful-verification.png', 2000);

  // 10. Tamper Detection Result
  await page.goto('http://localhost:3000/verify?hash=0xbf99de869e6954bc033bfd547dd056b6069959202ddbfd2bb122ef1e42d36197', { waitUntil: 'networkidle0' });
  await snap('10-tamper-detection.png', 2000);

  // 11. QR Verification Result
  await page.goto('http://localhost:3000/verify', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const qrBtn = btns.find(b => b.innerText.includes('QR Code'));
    if (qrBtn) qrBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const qrInput = await page.$('input[placeholder*="verify?hash="]');
  if (qrInput) {
    await qrInput.type('https://emertech-certify.vercel.app/verify?hash=0xbf99de869e6954bc033bfd547dd056b6069959202ddbfd2bb122ef1e42d36196');
    await page.click('button[type="submit"]');
  }
  await snap('11-qr-verification.png', 2000);

  // 7. Generated PDF Certificate Preview (Navigate to certificate file or modal)
  fs.copyFileSync(
    path.resolve(__dirname, '../backend/storage/certificates/demo-certificate.pdf'),
    path.join(frontendBuildPath, 'demo-certificate.pdf')
  );
  await page.goto('http://localhost:3000/demo-certificate.pdf', { waitUntil: 'networkidle0' });
  await snap('07-generated-pdf-certificate.png', 2000);

  await browser.close();
  frontendServer.close();
  backendServer.close();
  await disconnectDatabase();

  console.log('🎉 All 11 genuine screenshots captured successfully in docs/screenshots/ !');
}

run().catch((err) => {
  console.error('❌ Screenshot capture failed:', err);
  process.exit(1);
});
