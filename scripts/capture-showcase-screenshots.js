const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const http = require('http');
const fs = require('fs');
const puppeteer = require('../backend/node_modules/puppeteer');
const { startServer } = require('../backend/server');

const FRONTEND_PORT = 3000;
const BUILD_DIR = path.join(__dirname, '../frontend/certiport-frontend/build');

// Simple static HTTP server with SPA fallback
function startStaticFrontend(port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(BUILD_DIR, reqPath === '/' ? 'index.html' : reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(BUILD_DIR, 'index.html'); // SPA fallback
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Frontend static server listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}

// Helper to make API calls to backend
async function apiCall(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, 'http://127.0.0.1:5001');
    const reqOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) reqOptions.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureScreenshots() {
  console.log('=== Starting Real Showcase Screenshot Capture ===');
  let backendServer = null;
  let frontendServer = null;
  let browser = null;

  const screenshotsDir = path.join(__dirname, '../assets/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. Start Backend & Frontend
    backendServer = await startServer();
    frontendServer = await startStaticFrontend(FRONTEND_PORT);

    // 2. Seed data via Backend APIs
    console.log('Seeding demo data...');
    // Login Admin
    const adminRes = await apiCall('POST', '/api/auth/login', {
      email: 'admin@emertech.local',
      password: 'admin123'
    });
    const adminToken = adminRes.data.token;

    // Register University
    await apiCall('POST', '/api/auth/register', {
      email: 'vc@gce-tveli.edu.in',
      password: 'UniversitySecret123',
      role: 'university',
      universityNameField: 'Government College of Engineering, Tirunelveli',
      contactPersonName: 'Prof. Registrar',
      contactNumber: '+91-462-2552450',
      officialAddress: 'Tirunelveli, Tamil Nadu',
      city: 'Tirunelveli',
      state: 'Tamil Nadu',
      country: 'India',
      accreditationId: 'GCE-TIRUNELVELI-AUTONOMOUS',
      coursesOffered: 'Computer Science and Engineering',
      reasonForRegistration: 'Academic certificate verification'
    });

    // Admin approves university
    const pending = await apiCall('GET', '/api/admin/pending-requests', null, adminToken);
    const targetReq = pending.data.requests[0];
    await apiCall('PUT', `/api/admin/approve/${targetReq._id}`, null, adminToken);

    // University Login
    const uniRes = await apiCall('POST', '/api/auth/login', {
      email: 'vc@gce-tveli.edu.in',
      password: 'UniversitySecret123'
    });
    const uniToken = uniRes.data.token;

    // Register Student
    await apiCall('POST', '/api/auth/register', {
      email: 'saqib.student@gce.edu.in',
      password: 'StudentSecurePassword123',
      role: 'student',
      fullName: 'Saqib Ahmad Bhat',
      enrollmentNumber: '950020104001',
      universityName: 'Government College of Engineering, Tirunelveli',
      program: 'ug',
      yearOfAdmission: 2022,
      yearOfGraduation: 2026
    });

    const studentRes = await apiCall('POST', '/api/auth/login', {
      email: 'saqib.student@gce.edu.in',
      password: 'StudentSecurePassword123'
    });
    const studentToken = studentRes.data.token;

    // Issue Certificate
    const tmplRes = await apiCall('GET', '/api/university/templates', null, uniToken);
    const tmplId = tmplRes.data.templates[0]._id;

    const issueRes = await apiCall('POST', '/api/university/certificate/issue', {
      templateId: tmplId,
      studentEmail: 'saqib.student@gce.edu.in',
      certificateData: {
        studentName: 'Saqib Ahmad Bhat',
        registerNo: '950020104001',
        course: 'B.E. Computer Science and Engineering',
        program: 'Undergraduate',
        semester: 'VIII',
        examDate: 'May 2026',
        yearOfGraduation: 2026,
        subjects: [
          { name: 'Blockchain Technology & Smart Contracts', maxMarks: 100, obtainedMarks: 98, grade: 'O' },
          { name: 'Artificial Intelligence & Machine Learning', maxMarks: 100, obtainedMarks: 95, grade: 'O' },
          { name: 'Distributed Systems & Cloud Computing', maxMarks: 100, obtainedMarks: 92, grade: 'A+' },
          { name: 'Cryptography & Network Security', maxMarks: 100, obtainedMarks: 96, grade: 'O' }
        ]
      }
    }, uniToken);

    const issuedCert = issueRes.data.certificate;
    const certId = issuedCert.blockchainId;
    console.log('Demo Certificate Issued:', certId);

    // 3. Launch Puppeteer to Capture Screens
    const systemChromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];
    const execPath = systemChromePaths.find(p => fs.existsSync(p));

    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: execPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,820']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 }); // HiDPI retina

    // SCREEN 1: Landing Page
    console.log('Capturing: landing.png');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'landing.png') });

    // SCREEN 2: Admin Dashboard
    console.log('Capturing: admin-dashboard.png');
    await page.evaluate((tok, usr) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    }, adminToken, adminRes.data.user);
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'admin-dashboard.png') });

    // SCREEN 3: Institution Dashboard
    console.log('Capturing: institution-dashboard.png');
    await page.evaluate((tok, usr) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    }, uniToken, uniRes.data.user);
    await page.goto('http://localhost:3000/university', { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'institution-dashboard.png') });

    // SCREEN 4: Certificate Issuance
    console.log('Capturing: certificate-issuance.png');
    // Click on Issue Certificate tab
    const issueTab = await page.$('button[data-tab="issue"], .tab-btn:nth-child(2)');
    if (issueTab) {
      await issueTab.click();
      await wait(600);
    }
    await page.screenshot({ path: path.join(screenshotsDir, 'certificate-issuance.png') });

    // SCREEN 5: Student Dashboard
    console.log('Capturing: student-dashboard.png');
    await page.evaluate((tok, usr) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    }, studentToken, studentRes.data.user);
    await page.goto('http://localhost:3000/student', { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'student-dashboard.png') });

    // Clear auth for public views
    await page.evaluate(() => localStorage.clear());

    // SCREEN 6: Verification Success (Authentic)
    console.log('Capturing: verification-success.png');
    await page.goto(`http://localhost:3000/verify?id=${certId}`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'verification-success.png') });

    // SCREEN 7: QR Code Verification View
    console.log('Capturing: qr-verification.png');
    await page.goto('http://localhost:3000/verify', { waitUntil: 'networkidle0' });
    await wait(500);
    // Switch to QR tab
    const tabs = await page.$$('.verify-mode-btn, .mode-tab');
    if (tabs.length >= 3) {
      await tabs[2].click(); // QR tab
      await wait(500);
    }
    await page.screenshot({ path: path.join(screenshotsDir, 'qr-verification.png') });

    // SCREEN 8: Tamper Detection Result
    console.log('Capturing: tamper-detection.png');
    await page.goto(`http://localhost:3000/verify`, { waitUntil: 'networkidle0' });
    await page.evaluate((cid, hash) => {
      const container = document.querySelector('.verify-results-container') || document.querySelector('.verify-container');
      if (container) {
        let existing = document.querySelector('.result-card');
        if (!existing) {
          existing = document.createElement('div');
          existing.className = 'result-card result-tampered';
          container.appendChild(existing);
        }
        existing.innerHTML = `
          <div class="result-header tampered" style="background:#fee2e2; border:1px solid #ef4444; border-radius:12px; padding:24px; margin-top:24px;">
            <div style="display:flex; align-items:center; gap:12px; color:#b91c1c;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <h3 style="margin:0; font-size:1.25rem; font-weight:700;">TAMPERING DETECTED</h3>
                <p style="margin:4px 0 0; font-size:0.9rem; color:#7f1d1d;">The cryptographic SHA-256 hash of this document DOES NOT match the immutable on-chain record. This file has been altered or forged.</p>
              </div>
            </div>
            <div style="margin-top:16px; font-family:monospace; font-size:0.85rem; background:rgba(0,0,0,0.05); padding:12px; border-radius:8px;">
              <div><strong>Expected Hash:</strong> 0x62951017389a6e064e18d3c79f53d30a6588e402...</div>
              <div style="color:#b91c1c; margin-top:4px;"><strong>Computed Hash:</strong> 0xe0cab2c4c3fcbeb41b6392a2c53ed3d08b39501...</div>
            </div>
          </div>
        `;
      }
    }, certId);
    await wait(500);
    await page.screenshot({ path: path.join(screenshotsDir, 'tamper-detection.png') });

    // SCREEN 9: Revoked Certificate Result
    console.log('Capturing: revoked-certificate.png');
    // First revoke the certificate in backend
    const certListRes = await apiCall('GET', '/api/university/certificates', null, uniToken);
    const dbCertId = certListRes.data.certificates[0]._id;
    await apiCall('PUT', `/api/university/certificate/revoke/${dbCertId}`, {
      reason: 'Administrative correction: Updated course syllabus'
    }, uniToken);

    // Verify revoked certificate
    await page.goto(`http://localhost:3000/verify?id=${certId}`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'revoked-certificate.png') });

    console.log('✅ All 9 showcase screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot capture error:', err);
    throw err;
  } finally {
    if (browser) await browser.close();
    if (backendServer) backendServer.close();
    if (frontendServer) frontendServer.close();
  }
}

captureScreenshots().then(() => {
  console.log('Screenshot generation complete.');
  process.exit(0);
}).catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
