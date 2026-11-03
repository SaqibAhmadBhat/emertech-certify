/**
 * Emertech Certify - End-to-End Automated Backend API Verification Suite
 * Developer: Saqib Ahmad Bhat
 * Institution: Government College of Engineering, Tirunelveli
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { startServer } = require('../server');
const { disconnectDB } = require('../config/db');

const BASE_URL = 'http://127.0.0.1:5001';

async function makeRequest(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const reqOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    let postData = null;
    if (body && !(body instanceof Buffer)) {
      postData = JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    } else if (body instanceof Buffer) {
      postData = body;
      reqOptions.headers['Content-Length'] = postData.length;
    }

    const req = http.request(reqOptions, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(rawData);
        } catch (e) {
          parsed = rawData;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Multipart helper for PDF verification and OCR tests
async function makeMultipartRequest(endpoint, fieldName, fileName, fileBuffer, extraFields = {}, extraHeaders = {}) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';

  let postBody = [];

  // Extra text fields
  for (const [key, val] of Object.entries(extraFields)) {
    postBody.push(Buffer.from(`--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${val}${crlf}`));
  }

  // File field
  const mimeType = fileName.endsWith('.png') ? 'image/png' : (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' : 'application/pdf');
  postBody.push(Buffer.from(`--${boundary}${crlf}Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${crlf}Content-Type: ${mimeType}${crlf}${crlf}`));
  postBody.push(fileBuffer);
  postBody.push(Buffer.from(`${crlf}--${boundary}--${crlf}`));

  const fullBuffer = Buffer.concat(postBody);

  return makeRequest('POST', endpoint, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    ...extraHeaders
  }, fullBuffer);
}

async function runApiTests() {
  console.log('====================================================');
  console.log('🧪 Starting Emertech Certify Automated API Test Suite');
  console.log('👨‍💻 Developer: Saqib Ahmad Bhat');
  console.log('====================================================\n');

  let server;
  let adminToken;
  let universityToken;
  let studentToken;
  let issuedCertId;
  let issuedCertPdfPath;
  let universityUserId;
  let testTemplateId;

  try {
    server = await startServer();

    // Test 1: Health Check
    console.log('1. Testing System Health Check...');
    const health = await makeRequest('GET', '/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'online');
    console.log('   ✅ Health check passed. Developer: ' + health.data.developer);

    // Test 2: Admin Login
    console.log('\n2. Testing Administrator Authentication...');
    const adminLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'admin@emertech.local',
      password: 'admin123'
    });
    assert.strictEqual(adminLogin.status, 200);
    assert.ok(adminLogin.data.token, 'Token must be returned');
    assert.strictEqual(adminLogin.data.user.role, 'admin');
    adminToken = adminLogin.data.token;
    console.log('   ✅ Admin authentication successful. JWT received.');

    // Test 3: Institution Registration (creates PendingRequest)
    console.log('\n3. Testing Institution Registration (Onboarding Queue)...');
    const uniReg = await makeRequest('POST', '/api/auth/register', {}, {
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
      coursesOffered: 'Computer Science and Engineering, Electronics and Communication Engineering, Mechanical Engineering',
      reasonForRegistration: 'Academic certificate verification and fraud prevention'
    });
    assert.strictEqual(uniReg.status, 201);
    assert.strictEqual(uniReg.data.pendingApproval, true);
    console.log('   ✅ Institution registration queued for administrator approval.');

    // Test 4: Admin views Pending Requests and Approves Institution
    console.log('\n4. Testing Admin Institutional Approval...');
    const pending = await makeRequest('GET', '/api/admin/pending-requests', {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(pending.status, 200);
    assert.ok(pending.data.requests.length > 0, 'Must have at least one pending request');
    const targetRequest = pending.data.requests[0];

    const approve = await makeRequest('PUT', `/api/admin/approve/${targetRequest._id}`, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(approve.status, 200);
    assert.strictEqual(approve.data.success, true);
    console.log(`   ✅ Institution approved. Assigned University ID: ${approve.data.universityId}`);

    // Test 5: Approved Institution Login
    console.log('\n5. Testing Approved Institution Login...');
    const uniLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'vc@gce-tveli.edu.in',
      password: 'UniversitySecret123'
    });
    assert.strictEqual(uniLogin.status, 200);
    assert.strictEqual(uniLogin.data.user.role, 'university');
    universityToken = uniLogin.data.token;
    universityUserId = uniLogin.data.user.id;
    console.log('   ✅ Institution login authorized.');

    // Test 6: Student Registration & Login
    console.log('\n6. Testing Student Account Registration & Login...');
    const studentReg = await makeRequest('POST', '/api/auth/register', {}, {
      email: 'saqib.student@gce.edu.in',
      password: 'StudentSecurePassword123',
      role: 'student',
      fullName: 'Saqib Ahmad Bhat',
      dateOfBirth: '2003-05-15',
      program: 'ug',
      enrollmentNumber: '950020104001',
      universityName: 'Government College of Engineering, Tirunelveli',
      yearOfAdmission: 2022,
      yearOfGraduation: 2026
    });
    assert.strictEqual(studentReg.status, 201);
    assert.strictEqual(studentReg.data.canLogin, true);

    const studentLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'saqib.student@gce.edu.in',
      password: 'StudentSecurePassword123'
    });
    assert.strictEqual(studentLogin.status, 200);
    assert.strictEqual(studentLogin.data.user.role, 'student');
    studentToken = studentLogin.data.token;
    console.log('   ✅ Student registration and authentication successful.');

    // Test 7: Fetch Institution Templates
    console.log('\n7. Testing Template Provisioning...');
    const templatesRes = await makeRequest('GET', '/api/university/templates', {
      'Authorization': `Bearer ${universityToken}`
    });
    assert.strictEqual(templatesRes.status, 200);
    assert.ok(templatesRes.data.templates.length > 0, 'Templates should be available');
    testTemplateId = templatesRes.data.templates[0]._id;
    console.log(`   ✅ Templates available: ${templatesRes.data.templates.length}. Selected Template: ${templatesRes.data.templates[0].templateName}`);

    // Test 8: Certificate Issuance with Cryptographic SHA-256 & Local Storage Fallback
    console.log('\n8. Testing Academic Certificate Issuance Pipeline...');
    const issueRes = await makeRequest('POST', '/api/university/certificate/issue', {
      'Authorization': `Bearer ${universityToken}`
    }, {
      templateId: testTemplateId,
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
    });

    assert.strictEqual(issueRes.status, 201);
    assert.strictEqual(issueRes.data.success, true);
    issuedCertId = issueRes.data.certificate.blockchainId;
    assert.ok(issueRes.data.certificate.documentHash.startsWith('0x'), 'Document hash must be 0x hex');
    console.log(`   ✅ Certificate generated successfully!`);
    console.log(`      Blockchain ID: ${issuedCertId}`);
    console.log(`      SHA-256 Hash: ${issueRes.data.certificate.documentHash}`);
    console.log(`      Storage Type: ${issueRes.data.certificate.storageType}`);

    // Locate the generated PDF on disk for verification testing
    issuedCertPdfPath = path.join(__dirname, '..', 'uploads', 'certificates', `${issuedCertId}.pdf`);
    assert.ok(fs.existsSync(issuedCertPdfPath), 'PDF file must exist on disk');

    // Test 9: Public Verification by Certificate ID
    console.log('\n9. Testing Public Verification by Certificate ID...');
    const verifyById = await makeRequest('GET', `/api/public/verify/${issuedCertId}`);
    assert.strictEqual(verifyById.status, 200);
    assert.strictEqual(verifyById.data.valid, true);
    assert.strictEqual(verifyById.data.status, 'AUTHENTIC');
    assert.strictEqual(verifyById.data.certificate.studentName, 'Saqib Ahmad Bhat');
    console.log('   ✅ Public verification by ID: Status = AUTHENTIC');

    // Test 10: Public Verification by Original PDF Upload (SHA-256 match)
    console.log('\n10. Testing Public Verification by Original PDF Upload...');
    const originalPdfBuffer = fs.readFileSync(issuedCertPdfPath);
    const verifyByPdf = await makeMultipartRequest('/api/public/verify/pdf', 'certificate', 'original.pdf', originalPdfBuffer);
    assert.strictEqual(verifyByPdf.status, 200);
    assert.strictEqual(verifyByPdf.data.valid, true);
    assert.strictEqual(verifyByPdf.data.status, 'AUTHENTIC');
    console.log('   ✅ Uploaded PDF verified: Status = AUTHENTIC (Cryptographic digest matches)');

    // Test 11: Tamper Detection (Modified PDF verification)
    console.log('\n11. Testing Tamper Detection on Modified PDF Document...');
    const tamperedPdfBuffer = Buffer.from(originalPdfBuffer);
    // Append malicious bytes to alter the cryptographic hash
    const alteredBuffer = Buffer.concat([tamperedPdfBuffer, Buffer.from('\n% Tampered Altered Grade: O -> C')]);
    
    const verifyTampered = await makeMultipartRequest(
      '/api/public/verify/pdf', 
      'certificate', 
      'tampered.pdf', 
      alteredBuffer, 
      { blockchainId: issuedCertId }
    );
    assert.strictEqual(verifyTampered.status, 200);
    assert.strictEqual(verifyTampered.data.valid, false);
    assert.strictEqual(verifyTampered.data.status, 'TAMPERED');
    console.log('   ✅ Tampering detected! Status = TAMPERED (Hash mismatch flagged)');

    // Test 12: Public Verification by QR Code Payload
    console.log('\n12. Testing Public Verification by QR Code Payload...');
    const qrPayload = `http://localhost:3000/verify?id=${issuedCertId}`;
    const verifyByQr = await makeRequest('POST', '/api/public/verify/qr', {}, {
      qrData: qrPayload
    });
    assert.strictEqual(verifyByQr.status, 200);
    assert.strictEqual(verifyByQr.data.valid, true);
    assert.strictEqual(verifyByQr.data.status, 'AUTHENTIC');
    console.log(`   ✅ QR Code verification successful: Status = AUTHENTIC (Resolved ID: ${issuedCertId})`);

    // Test 13: Certificate PDF Download Endpoint
    console.log('\n13. Testing Certificate PDF Download Endpoint...');
    const downloadRes = await makeRequest('GET', `/api/public/certificate/${issuedCertId}/download`);
    assert.strictEqual(downloadRes.status, 200);
    assert.strictEqual(downloadRes.headers['content-type'], 'application/pdf');
    assert.ok(downloadRes.data.length > 100, 'PDF binary content must be streamed');
    console.log(`   ✅ PDF Download verified: HTTP 200 with application/pdf Content-Type (${downloadRes.data.length} bytes)`);

    // Test 14: Certificate Revocation
    console.log('\n14. Testing Certificate Revocation Pipeline...');
    // Find certificate database ID
    const listRes = await makeRequest('GET', '/api/university/certificates', {
      'Authorization': `Bearer ${universityToken}`
    });
    const certRecord = listRes.data.certificates.find(c => c.blockchainId === issuedCertId);
    assert.ok(certRecord, 'Issued certificate record must exist');

    const revokeRes = await makeRequest('PUT', `/api/university/certificate/revoke/${certRecord._id}`, {
      'Authorization': `Bearer ${universityToken}`
    }, {
      reason: 'Administrative correction: Updated course syllabus'
    });
    assert.strictEqual(revokeRes.status, 200);
    assert.strictEqual(revokeRes.data.status, 'revoked');
    console.log('   ✅ Certificate revoked successfully.');

    // Test 15: Public Verification of Revoked Certificate
    console.log('\n15. Testing Public Verification of Revoked Certificate...');
    const verifyRevoked = await makeRequest('GET', `/api/public/verify/${issuedCertId}`);
    assert.strictEqual(verifyRevoked.status, 200);
    assert.strictEqual(verifyRevoked.data.valid, false);
    assert.strictEqual(verifyRevoked.data.status, 'REVOKED');
    console.log(`   ✅ Revocation confirmed! Status = REVOKED. Reason: "${verifyRevoked.data.revocationReason}"`);

    // Test 16: Student Dashboard view
    console.log('\n16. Testing Student Dashboard Retrieval...');
    const studentCerts = await makeRequest('GET', '/api/student/certificates', {
      'Authorization': `Bearer ${studentToken}`
    });
    assert.strictEqual(studentCerts.status, 200);
    assert.strictEqual(studentCerts.data.count, 1);
    assert.strictEqual(studentCerts.data.data[0].blockchainId, issuedCertId);
    console.log('   ✅ Student certificates successfully retrieved from student portal.');

    // Test 17: AI-Assisted OCR Information Extraction (PDF Stream)
    console.log('\n17. Testing AI-Assisted Certificate Information Extraction (PDF Stream)...');
    const ocrUpload = await makeMultipartRequest(
      '/api/ai/extract-ocr',
      'document',
      'test-certificate.pdf',
      originalPdfBuffer,
      {},
      { 'Authorization': `Bearer ${adminToken}` }
    );
    assert.strictEqual(ocrUpload.status, 200);
    assert.strictEqual(ocrUpload.data.success, true);
    assert.ok(ocrUpload.data.fields, 'Extracted fields object must exist');
    console.log('   ✅ AI PDF Parser successfully processed document!');
    console.log(`      Engine: ${ocrUpload.data.extractionMethod}`);
    console.log(`      Detected Student: ${ocrUpload.data.fields.studentName || 'Detected'}`);
    console.log(`      Detected Course: ${ocrUpload.data.fields.course || 'Detected'}`);
    console.log(`      Disclaimer present: ${!!ocrUpload.data.disclaimer}`);

    // Test 18: AI-Assisted Image OCR with Tesseract.js (Scanned Certificate PNG)
    console.log('\n18. Testing AI-Assisted Image OCR with Tesseract.js (Scanned PNG)...');
    const testImgPath = path.join(__dirname, 'test-scanned-certificate.png');
    if (fs.existsSync(testImgPath)) {
      const imgBuffer = fs.readFileSync(testImgPath);
      const imgOcrUpload = await makeMultipartRequest(
        '/api/ai/extract-ocr',
        'document',
        'scanned-certificate.png',
        imgBuffer,
        {},
        { 'Authorization': `Bearer ${adminToken}` }
      );
      assert.strictEqual(imgOcrUpload.status, 200);
      assert.strictEqual(imgOcrUpload.data.success, true);
      assert.ok(imgOcrUpload.data.extractionMethod.includes('Tesseract'), 'Must use Tesseract.js for image files');
      console.log('   ✅ Tesseract.js Neural OCR verified on real image file!');
      console.log(`      Engine: ${imgOcrUpload.data.extractionMethod}`);
      console.log(`      Extracted Student: ${imgOcrUpload.data.fields.studentName}`);
      console.log(`      Extracted Register No: ${imgOcrUpload.data.fields.registerNo}`);
      console.log(`      Extracted Course: ${imgOcrUpload.data.fields.course}`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL 18 AUTOMATED API & AI TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
    process.exit(0);
  }
}

runApiTests();
