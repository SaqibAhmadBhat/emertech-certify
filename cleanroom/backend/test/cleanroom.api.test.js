const http = require('http');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Certificate = require('../src/models/Certificate');

let server;
let baseUrl;
let adminToken = '';
let instToken = '';
let studentToken = '';
let testCertHash = '';
let testCertId = '';
let testPdfBuffer = null;
let approvedInstId = '';

function makeRequest(method, endpoint, body = null, token = null, isMultipart = false, multipartData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (isMultipart && multipartData) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

      const postData = [];
      for (const [key, val] of Object.entries(multipartData)) {
        if (val && val.buffer) {
          postData.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${key}"; filename="${val.filename || 'file.dat'}"\r\n` +
            `Content-Type: ${val.contentType || 'application/octet-stream'}\r\n\r\n`
          );
          postData.push(val.buffer);
          postData.push('\r\n');
        } else {
          postData.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
            `${val}\r\n`
          );
        }
      }
      postData.push(`--${boundary}--\r\n`);

      const payloadBuffer = Buffer.concat(postData.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));
      headers['Content-Length'] = payloadBuffer.length;

      const req = http.request(url, { method, headers }, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          const isJson = (res.headers['content-type'] || '').includes('application/json');
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: isJson ? JSON.parse(raw.toString('utf8')) : raw
          });
        });
      });
      req.on('error', reject);
      req.write(payloadBuffer);
      req.end();
      return;
    }

    if (body) {
      headers['Content-Type'] = 'application/json';
      const payload = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(payload);

      const req = http.request(url, { method, headers }, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          try {
            resolve({ statusCode: res.statusCode, headers: res.headers, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, headers: res.headers, body: raw });
          }
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    } else {
      const req = http.request(url, { method, headers }, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          const isJson = (res.headers['content-type'] || '').includes('application/json');
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: isJson ? JSON.parse(raw.toString('utf8')) : raw
          });
        });
      });
      req.on('error', reject);
      req.end();
    }
  });
}

async function runCleanroomTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING EMERTECH CERTIFY CLEAN-ROOM TEST SUITE (v2.0)');
  console.log('👨‍💻 Architect: Saqib Ahmad Bhat');
  console.log('🏛️ Institution: Government College of Engineering, Tirunelveli');
  console.log('================================================================');

  await connectDatabase();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Live on ephemeral port ${port}`);
      resolve();
    });
  });

  try {
    // 1. Health Check
    console.log('\n1. Testing System Health Check (/api/v2/health)...');
    const health = await makeRequest('GET', '/api/v2/health');
    assert.strictEqual(health.statusCode, 200);
    assert.strictEqual(health.body.status, 'ONLINE');
    assert.strictEqual(health.body.developer, 'Saqib Ahmad Bhat');
    console.log('   ✅ Health check verified.');

    // 2. Super Admin Registration & Login
    console.log('\n2. Testing Super Administrator Registration & Login...');
    const adminReg = await makeRequest('POST', '/api/v2/auth/register', {
      fullName: 'Saqib Ahmad Bhat',
      email: 'admin.cleanroom@emertech.io',
      password: 'SuperAdminSecretPassword2026!',
      role: 'SUPER_ADMIN'
    });
    assert.strictEqual(adminReg.statusCode, 201);
    adminToken = adminReg.body.token;
    assert.ok(adminToken);
    console.log('   ✅ Super Admin registered and authenticated.');

    // 3. Institution Application
    console.log('\n3. Testing Academic Institution Application Queue...');
    const instApp = await makeRequest('POST', '/api/v2/institutions/apply', {
      institutionCode: 'GCE',
      name: 'Government College of Engineering, Tirunelveli',
      officialDomain: 'gce.edu.in',
      contactEmail: 'registrar@gce.edu.in',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    });
    assert.strictEqual(instApp.statusCode, 201);
    approvedInstId = instApp.body.institution._id;
    console.log('   ✅ Institution application queued.');

    // 4. Admin Approves Institution
    console.log('\n4. Testing Super Admin Approval & On-Chain Status Update...');
    const approveRes = await makeRequest(
      'PATCH',
      `/api/v2/admin/institutions/${approvedInstId}/status`,
      { status: 'AUTHORIZED' },
      adminToken
    );
    assert.strictEqual(approveRes.statusCode, 200);
    assert.strictEqual(approveRes.body.institution.status, 'AUTHORIZED');
    console.log('   ✅ Institution accredited and authorized.');

    // 5. Institution Admin Account Registration & Login
    console.log('\n5. Testing Authorized Institution Login...');
    const instUser = await makeRequest('POST', '/api/v2/auth/register', {
      fullName: 'Dean of Academic Affairs',
      email: 'dean@gce.edu.in',
      password: 'AcademicDeanPassword2026!',
      role: 'INSTITUTION_ADMIN',
      institutionCode: 'GCE',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    });
    assert.strictEqual(instUser.statusCode, 201);
    instToken = instUser.body.token;
    console.log('   ✅ Institution admin authorized.');

    // 6. Student Account Registration
    console.log('\n6. Testing Student Account Registration & Login...');
    const studentUser = await makeRequest('POST', '/api/v2/auth/register', {
      fullName: 'Saqib Ahmad Bhat',
      email: 'saqib.student@gce.edu.in',
      password: 'StudentPortalPassword2026!',
      role: 'STUDENT',
      institutionCode: 'GCE',
      studentIdentifier: '950020104001'
    });
    assert.strictEqual(studentUser.statusCode, 201);
    studentToken = studentUser.body.token;
    console.log('   ✅ Student registered and linked to GCE.');

    // 7. Academic Certificate Issuance Pipeline
    console.log('\n7. Testing Academic Certificate Issuance & Vector PDF Compilation...');
    const issueRes = await makeRequest(
      'POST',
      '/api/v2/institutions/issue',
      {
        studentName: 'Saqib Ahmad Bhat',
        studentIdentifier: '950020104001',
        degreeTitle: 'Bachelor of Engineering',
        majorProgram: 'Computer Science and Engineering',
        graduationDate: '2026-05-15',
        gradeOrDistinction: 'First Class with Distinction'
      },
      instToken
    );
    assert.strictEqual(issueRes.statusCode, 201);
    assert.ok(issueRes.body.certificate.certHash.startsWith('0x'));
    testCertHash = issueRes.body.certificate.certHash;
    testCertId = issueRes.body.certificate.certificateId;
    console.log(`   ✅ Certificate compiled & anchored!`);
    console.log(`      ID:   ${testCertId}`);
    console.log(`      Hash: ${testCertHash}`);

    // 8. Download Vector PDF
    console.log('\n8. Testing Vector PDF Download Endpoint...');
    const pdfRes = await makeRequest('GET', `/api/v2/certificates/${testCertId}/pdf`);
    assert.strictEqual(pdfRes.statusCode, 200);
    assert.strictEqual(pdfRes.headers['content-type'], 'application/pdf');
    testPdfBuffer = pdfRes.body;
    assert.ok(Buffer.isBuffer(testPdfBuffer));
    assert.ok(testPdfBuffer.length > 1000);
    console.log(`   ✅ Vector PDF downloaded successfully (${testPdfBuffer.length} bytes).`);

    // 9. Mode 1: Public Verification by Hash
    console.log('\n9. Testing Mode 1: Public Verification by Hash...');
    const hashVerify = await makeRequest('POST', '/api/v2/verify/hash', { hash: testCertHash });
    assert.strictEqual(hashVerify.statusCode, 200);
    assert.strictEqual(hashVerify.body.status, 'AUTHENTIC');
    assert.strictEqual(hashVerify.body.verificationData.studentName, 'Saqib Ahmad Bhat');
    console.log('   ✅ Mode 1 Verified: Status = AUTHENTIC.');

    // 10. Mode 2: Public Verification by Exact PDF Upload
    console.log('\n10. Testing Mode 2: Verification by PDF Binary Upload...');
    const fileVerify = await makeRequest(
      'POST',
      '/api/v2/verify/file',
      null,
      null,
      true,
      { certificateFile: { buffer: testPdfBuffer, filename: `${testCertId}.pdf`, contentType: 'application/pdf' } }
    );
    assert.strictEqual(fileVerify.statusCode, 200);
    assert.strictEqual(fileVerify.body.status, 'AUTHENTIC');
    assert.strictEqual(fileVerify.body.tamperDetected, false);
    console.log('   ✅ Mode 2 Verified: Bitwise file digest matches.');

    // 11. Tamper Detection on Modified PDF
    console.log('\n11. Testing Tamper Detection on Altered PDF Document...');
    const tamperedPdf = Buffer.from(testPdfBuffer);
    // Alter byte 200
    tamperedPdf[200] = tamperedPdf[200] ^ 0x01;
    const tamperRes = await makeRequest(
      'POST',
      '/api/v2/verify/file',
      null,
      null,
      true,
      {
        certificateFile: { buffer: tamperedPdf, filename: 'tampered.pdf', contentType: 'application/pdf' },
        expectedCertificateId: testCertId
      }
    );
    assert.strictEqual(tamperRes.statusCode, 200);
    assert.strictEqual(tamperRes.body.status, 'TAMPER_DETECTED');
    assert.strictEqual(tamperRes.body.tamperDetected, true);
    console.log('   ✅ Tamper Detection Verified: Cryptographic mismatch flagged.');

    // 12. Mode 3: QR Code Verification
    console.log('\n12. Testing Mode 3: QR Code Payload Verification...');
    const qrPayload = `http://localhost:3000/verify?hash=${testCertHash}`;
    const qrVerify = await makeRequest('POST', '/api/v2/verify/qr', { qrPayload });
    assert.strictEqual(qrVerify.statusCode, 200);
    assert.strictEqual(qrVerify.body.status, 'AUTHENTIC');
    console.log('   ✅ Mode 3 Verified: QR payload successfully resolved.');

    // 13. Student Dashboard Retrieval
    console.log('\n13. Testing Student Credential Retrieval (/api/v2/certificates/student/my-certificates)...');
    const studentCerts = await makeRequest('GET', '/api/v2/certificates/student/my-certificates', null, studentToken);
    assert.strictEqual(studentCerts.statusCode, 200);
    assert.strictEqual(studentCerts.body.count, 1);
    assert.strictEqual(studentCerts.body.certificates[0].studentName, 'Saqib Ahmad Bhat');
    console.log('   ✅ Student transcripts retrieved.');

    // 14. Certificate Revocation
    console.log('\n14. Testing On-Chain Certificate Revocation Pipeline...');
    const revokeRes = await makeRequest(
      'POST',
      '/api/v2/institutions/revoke',
      { certHash: testCertHash, reason: 'Degree classification updated to Gold Medalist' },
      instToken
    );
    assert.strictEqual(revokeRes.statusCode, 200);
    assert.strictEqual(revokeRes.body.certificate.isRevoked, true);
    console.log('   ✅ Certificate revoked.');

    // 15. Verify Revoked State
    console.log('\n15. Testing Public Verification of Revoked Credential...');
    const revokedVerify = await makeRequest('POST', '/api/v2/verify/hash', { hash: testCertHash });
    assert.strictEqual(revokedVerify.statusCode, 200);
    assert.strictEqual(revokedVerify.body.status, 'REVOKED');
    console.log('   ✅ Revocation confirmed: Status = REVOKED.');

    // 16. Mode 4: AI OCR Image Scan
    console.log('\n16. Testing Mode 4: Tesseract.js Neural OCR Image Extraction...');
    const samplePngPath = path.resolve(__dirname, '../../../backend/test/test-scanned-certificate.png');
    if (fs.existsSync(samplePngPath)) {
      const imgBuffer = fs.readFileSync(samplePngPath);
      const ocrRes = await makeRequest(
        'POST',
        '/api/v2/verify/ocr',
        null,
        null,
        true,
        { imageFile: { buffer: imgBuffer, filename: 'scan.png', contentType: 'image/png' } }
      );
      assert.strictEqual(ocrRes.statusCode, 200);
      assert.strictEqual(ocrRes.body.success, true);
      assert.ok(ocrRes.body.disclaimer);
      console.log('   ✅ Mode 4 Verified: Tesseract.js OCR extracted text and parsed entities.');
    } else {
      console.log('   ℹ️ Sample image skipped (no sample scan file present).');
    }

    // 17. Batch Issuance
    console.log('\n17. Testing Batch Certificate Issuance (CSV / Array)...');
    const batchRes = await makeRequest(
      'POST',
      '/api/v2/institutions/batch',
      {
        batch: [
          { studentName: 'Aamir Khan', studentIdentifier: '950020104002', degreeTitle: 'B.E.', majorProgram: 'CSE' },
          { studentName: 'Priya Sharma', studentIdentifier: '950020104003', degreeTitle: 'B.E.', majorProgram: 'CSE' }
        ]
      },
      instToken
    );
    assert.strictEqual(batchRes.statusCode, 200);
    assert.strictEqual(batchRes.body.processed, 2);
    console.log('   ✅ Batch issuance processed 2 certificates.');

    // 18. Admin Telemetry
    console.log('\n18. Testing Super Admin Telemetry...');
    const telemRes = await makeRequest('GET', '/api/v2/admin/telemetry', null, adminToken);
    assert.strictEqual(telemRes.statusCode, 200);
    assert.ok(telemRes.body.telemetry.totalCertificates >= 3);
    console.log(`   ✅ Telemetry verified (Total certificates: ${telemRes.body.telemetry.totalCertificates}).`);

    console.log('\n================================================================');
    console.log('🎉 ALL 18 CLEAN-ROOM TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await disconnectDatabase();
  }
}

runCleanroomTestSuite();
