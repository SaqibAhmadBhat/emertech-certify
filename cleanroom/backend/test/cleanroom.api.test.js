const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { ethers } = require('ethers');

// Set isolated test environment before loading application
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // dynamic ephemeral port

const app = require('../src/app');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const { reconfigureBlockchain } = require('../src/config/blockchain');
const CryptoService = require('../src/services/CryptoService');
const KeyVaultService = require('../src/services/KeyVaultService');
const { bootstrapSuperAdmin } = require('../scripts/bootstrap-super-admin');
const Institution = require('../src/models/Institution');

let server;
let baseUrl = '';
let adminToken = '';
let instToken = '';
let studentToken = '';
let testCertHash = '';
let testCertId = '';
let approvedInstId = '';
let offlineInstId = '';
let hardhatNodeProcess = null;
let deployedContractAddress = '';
let directContractInstance = null;

let passedCount = 0;
let failedCount = 0;
let skippedCount = 0;

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

      const payload = Buffer.concat(postData.map(d => Buffer.isBuffer(d) ? d : Buffer.from(d, 'utf8')));
      headers['Content-Length'] = payload.length;

      const req = http.request(url, { method, headers }, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          try {
            resolve({ statusCode: res.statusCode, headers: res.headers, body: JSON.parse(raw), raw });
          } catch (e) {
            resolve({ statusCode: res.statusCode, headers: res.headers, raw });
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
      return;
    }

    let payload = '';
    if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: JSON.parse(raw), raw, binary: Buffer.concat(chunks) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, raw, binary: Buffer.concat(chunks) });
        }
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function checkNodeIsUp(rpcUrl) {
  return new Promise((resolve) => {
    const url = new URL(rpcUrl);
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 1000
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }));
    req.end();
  });
}

async function ensureLocalBlockchainNode() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
  let isUp = await checkNodeIsUp(rpcUrl);

  if (!isUp) {
    console.log('[Blockchain Setup] Local Hardhat node not detected on ' + rpcUrl + '. Spawning local Hardhat node...');
    const contractsDir = path.resolve(__dirname, '../../contracts');
    hardhatNodeProcess = spawn('npx', ['hardhat', 'node'], {
      cwd: contractsDir,
      stdio: 'ignore'
    });

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      isUp = await checkNodeIsUp(rpcUrl);
      if (isUp) break;
    }

    if (!isUp) {
      throw new Error('Failed to spawn local Hardhat blockchain node.');
    }
    console.log('[Blockchain Setup] Local Hardhat node started successfully.');
  } else {
    console.log('[Blockchain Setup] Connected to existing local JSON-RPC node at ' + rpcUrl);
  }

  // Deploy fresh EmertechCertificateRegistry.sol
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = provider.getSigner(0);

  const artifactPath = path.resolve(
    __dirname,
    '../../contracts/artifacts/contracts/EmertechCertificateRegistry.sol/EmertechCertificateRegistry.json'
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error('Contract artifact missing. Please compile contracts first via npx hardhat compile.');
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.deployed();

  deployedContractAddress = contract.address;
  directContractInstance = contract;

  console.log(`[Blockchain Setup] EmertechCertificateRegistry deployed to: ${deployedContractAddress}`);

  // Reconfigure backend blockchain client to point to deployed contract
  reconfigureBlockchain({
    rpcUrl,
    contractAddress: deployedContractAddress
  });
}

async function runCleanroomTestSuite() {
  console.log('================================================================');
  console.log('🧪 EMERTECH CERTIFY CLEAN-ROOM v2.0 INTEGRATION TEST SUITE');
  console.log('🏛️ Academic Fixture: Apex Institute of Technology (AIT)');
  console.log('🔗 On-Chain Consensus: Real Local Hardhat EVM Execution');
  console.log('================================================================');

  await connectDatabase();
  await ensureLocalBlockchainNode();

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Live on ephemeral port ${port}`);
      resolve();
    });
  });

  const institutionWallet = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat Account #1
  const fictionalStudent = {
    fullName: 'Jane H. Doe',
    studentName: 'Jane H. Doe',
    email: 'jane.doe@apex.edu.test',
    studentIdentifier: 'STU-2026-0042',
    degreeTitle: 'Bachelor of Science',
    majorProgram: 'Computer Engineering',
    graduationDate: '2026-05-15',
    gradeOrDistinction: 'First Class with Distinction'
  };

  try {
    // ------------------------------------------------------------------------
    // TEST 1: System Health Check
    // ------------------------------------------------------------------------
    try {
      console.log('\n1. Testing System Health Check (/api/v2/health)...');
      const health = await makeRequest('GET', '/api/v2/health');
      assert.strictEqual(health.statusCode, 200);
      assert.strictEqual(health.body.status, 'ONLINE');
      passedCount++;
      console.log('   ✅ Health check verified.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Health check failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 2: SHA-256 Validation & NIST Known-Answer Tests (KAT)
    // ------------------------------------------------------------------------
    try {
      console.log('\n2. Testing SHA-256 Known-Answer Tests (NIST FIPS 180-4) & Keccak Distinction...');
      assert.strictEqual(CryptoService.verifyNistVectors(), true);

      // Verify distinction between SHA-256 and Ethereum Keccak-256
      const testInput = 'EMERTECH_ACADEMIC_TEST_VECTOR';
      const shaDigest = CryptoService.computeSha256(testInput);
      const keccakDigest = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(testInput)).toLowerCase();

      assert.notStrictEqual(
        shaDigest,
        keccakDigest,
        'Security Invariant: SHA-256 and Keccak-256 must produce distinct digests'
      );
      assert.strictEqual(shaDigest.length, 66, 'SHA-256 digest must be 66 chars (0x + 64 hex)');
      assert.ok(shaDigest.startsWith('0x'));

      passedCount++;
      console.log('   ✅ NIST Known-Answer Tests passed. SHA-256 verified distinct from Keccak-256.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ SHA-256 verification failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 3: One-Time Super Administrator Bootstrap via CLI Logic & Login
    // ------------------------------------------------------------------------
    try {
      console.log('\n3. Testing One-Time Super Administrator Bootstrap via CLI Logic...');
      const bootstrapRes = await bootstrapSuperAdmin({
        email: 'governance.admin@emertech-test.internal',
        password: 'AdminSecurePassword2026!#',
        fullName: 'Test Governance Administrator'
      });
      assert.strictEqual(bootstrapRes.success, true);
      assert.strictEqual(bootstrapRes.user.role, 'SUPER_ADMIN');

      // Authenticate via login
      const loginRes = await makeRequest('POST', '/api/v2/auth/login', {
        email: 'governance.admin@emertech-test.internal',
        password: 'AdminSecurePassword2026!#'
      });
      assert.strictEqual(loginRes.statusCode, 200);
      adminToken = loginRes.body.token;
      assert.ok(adminToken, 'Super Admin JWT must be returned');

      passedCount++;
      console.log('   ✅ Super Administrator bootstrapped and authenticated successfully.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Super Admin bootstrap test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 4: Enforcement of One-Time Bootstrap Invariant (Second Bootstrap Fails)
    // ------------------------------------------------------------------------
    try {
      console.log('\n4. Testing Enforcement of One-Time Bootstrap Invariant...');
      const secondBootstrap = await bootstrapSuperAdmin({
        email: 'attacker.admin@internal',
        password: 'MaliciousPassword123!',
        fullName: 'Malicious Admin'
      });
      assert.strictEqual(secondBootstrap.success, false);
      assert.strictEqual(secondBootstrap.reason, 'SUPER_ADMIN_ALREADY_EXISTS');

      passedCount++;
      console.log('   ✅ One-time bootstrap invariant enforced: Multiple bootstrap attempts safely rejected.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ One-time bootstrap invariant test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 5: Prevention of Privilege Escalation: Public Registration Rejects SUPER_ADMIN
    // ------------------------------------------------------------------------
    try {
      console.log('\n5. Testing Prevention of Privilege Escalation: Rejection of SUPER_ADMIN...');
      const escalateAdmin = await makeRequest('POST', '/api/v2/auth/register', {
        fullName: 'Attacker Admin',
        email: 'attacker@evil.org',
        password: 'AttackerPassword123!',
        role: 'SUPER_ADMIN'
      });
      assert.strictEqual(escalateAdmin.statusCode, 403, 'Attempting to register SUPER_ADMIN must return 403');
      assert.strictEqual(escalateAdmin.body.success, false);
      assert.ok(escalateAdmin.body.message.includes('Privilege escalation rejected'));

      passedCount++;
      console.log('   ✅ Privilege escalation prevented: SUPER_ADMIN self-registration rejected with 403 Forbidden.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ SUPER_ADMIN escalation test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 6: Prevention of Privilege Escalation: Public Registration Rejects INSTITUTION_ADMIN
    // ------------------------------------------------------------------------
    try {
      console.log('\n6. Testing Prevention of Privilege Escalation: Rejection of INSTITUTION_ADMIN...');
      const escalateInst = await makeRequest('POST', '/api/v2/auth/register', {
        fullName: 'Attacker Dean',
        email: 'attacker.dean@evil.org',
        password: 'AttackerPassword123!',
        role: 'INSTITUTION_ADMIN'
      });
      assert.strictEqual(escalateInst.statusCode, 403, 'Attempting to register INSTITUTION_ADMIN must return 403');
      assert.strictEqual(escalateInst.body.success, false);
      assert.ok(escalateInst.body.message.includes('Privilege escalation rejected'));

      passedCount++;
      console.log('   ✅ Privilege escalation prevented: INSTITUTION_ADMIN self-registration rejected with 403 Forbidden.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ INSTITUTION_ADMIN escalation test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 7: Public Registration Enforces Least-Privilege STUDENT Role Defaults
    // ------------------------------------------------------------------------
    try {
      console.log('\n7. Testing Public Registration Least-Privilege STUDENT Role Defaults...');
      const studentReg = await makeRequest('POST', '/api/v2/auth/register', {
        fullName: fictionalStudent.fullName,
        email: fictionalStudent.email,
        password: 'StudentPortalPassword2026!',
        studentIdentifier: fictionalStudent.studentIdentifier
      });
      assert.strictEqual(studentReg.statusCode, 201);
      assert.strictEqual(studentReg.body.user.role, 'STUDENT');
      studentToken = studentReg.body.token;
      assert.ok(studentToken, 'Student JWT token must be issued');

      passedCount++;
      console.log('   ✅ Public registration enforced least-privilege STUDENT account.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Student registration test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 8: Academic Institution Application Queue (Apex Institute of Technology)
    // ------------------------------------------------------------------------
    try {
      console.log('\n8. Testing Academic Institution Application Queue...');
      const instApp = await makeRequest('POST', '/api/v2/institutions/apply', {
        institutionCode: 'AIT',
        name: 'Apex Institute of Technology',
        officialDomain: 'apex.edu.test',
        contactEmail: 'registrar@apex.edu.test',
        walletAddress: institutionWallet
      });
      assert.strictEqual(instApp.statusCode, 201);
      approvedInstId = instApp.body.institution._id;
      passedCount++;
      console.log('   ✅ Institution application queued.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Institution application failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 9: Super Admin Approves Institution & On-Chain Accreditation
    // ------------------------------------------------------------------------
    try {
      console.log('\n9. Testing Super Admin Approval & On-Chain Accreditation...');
      const approveRes = await makeRequest(
        'PATCH',
        `/api/v2/admin/institutions/${approvedInstId}/status`,
        { status: 'AUTHORIZED' },
        adminToken
      );
      assert.strictEqual(approveRes.statusCode, 200);
      assert.strictEqual(approveRes.body.institution.status, 'AUTHORIZED');
      assert.strictEqual(approveRes.body.institution.onChainAuthorized, true);

      // Verify on-chain accreditation directly from smart contract state
      const instOnChain = await directContractInstance.getInstitution(institutionWallet);
      assert.strictEqual(instOnChain.status, 2, 'Institution status on-chain must be 2 (Authorized)');
      assert.strictEqual(instOnChain.name, 'Apex Institute of Technology');

      passedCount++;
      console.log('   ✅ Institution accredited and verified on-chain via smart contract.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Admin institutional accreditation failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 10: Rejection of On-Chain Authorization for Invalid Wallet Address
    // ------------------------------------------------------------------------
    try {
      console.log('\n10. Testing Rejection of On-Chain Authorization for Invalid Wallet Address...');
      const invalidApp = await makeRequest('POST', '/api/v2/institutions/apply', {
        institutionCode: 'INV',
        name: 'Invalid Address Academy',
        officialDomain: 'invalid.edu.test',
        contactEmail: 'contact@invalid.edu.test',
        walletAddress: '0xNotAValidEthereumAddress'
      });
      assert.strictEqual(invalidApp.statusCode, 201);
      const invalidInstId = invalidApp.body.institution._id;

      const failedApprove = await makeRequest(
        'PATCH',
        `/api/v2/admin/institutions/${invalidInstId}/status`,
        { status: 'AUTHORIZED' },
        adminToken
      );
      assert.strictEqual(failedApprove.statusCode, 400, 'Invalid wallet must return 400');
      assert.strictEqual(failedApprove.body.onChainAuthorized, false);

      passedCount++;
      console.log('   ✅ Failed authorization correctly rejected; database status remains unapproved.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Failed authorization test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 11: Resilient Handling of Unavailable Blockchain During Authorization
    // ------------------------------------------------------------------------
    try {
      console.log('\n11. Testing Handling of Unavailable Blockchain During Authorization...');
      const offlineApp = await makeRequest('POST', '/api/v2/institutions/apply', {
        institutionCode: 'OFF',
        name: 'Offline University',
        officialDomain: 'offline.edu.test',
        contactEmail: 'contact@offline.edu.test',
        walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
      });
      assert.strictEqual(offlineApp.statusCode, 201);
      offlineInstId = offlineApp.body.institution._id;

      // Temporarily reconfigure to unreachable port
      reconfigureBlockchain({ rpcUrl: 'http://127.0.0.1:9999', contractAddress: deployedContractAddress });

      const offlineApprove = await makeRequest(
        'PATCH',
        `/api/v2/admin/institutions/${offlineInstId}/status`,
        { status: 'AUTHORIZED' },
        adminToken
      );
      assert.strictEqual(offlineApprove.statusCode, 502, 'Disconnected blockchain must return 502 Bad Gateway');
      assert.strictEqual(offlineApprove.body.onChainAuthorized, false);

      // Restore blockchain connection
      const activeRpc = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      reconfigureBlockchain({ rpcUrl: activeRpc, contractAddress: deployedContractAddress });

      passedCount++;
      console.log('   ✅ Blockchain unavailability handled safely; institution remains unapproved on-chain.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Unavailable blockchain test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 12: Institution Status Transition to SUSPENDED on Smart Contract
    // ------------------------------------------------------------------------
    try {
      console.log('\n12. Testing Institution Status Transition to SUSPENDED...');
      const suspendRes = await makeRequest(
        'PATCH',
        `/api/v2/admin/institutions/${approvedInstId}/status`,
        { status: 'SUSPENDED' },
        adminToken
      );
      assert.strictEqual(suspendRes.statusCode, 200);
      assert.strictEqual(suspendRes.body.institution.status, 'SUSPENDED');

      // Verify on-chain status is now 3 (Suspended)
      const instOnChain = await directContractInstance.getInstitution(institutionWallet);
      assert.strictEqual(instOnChain.status, 3, 'Smart contract must record status 3 (Suspended)');

      passedCount++;
      console.log('   ✅ Institution successfully suspended on-chain (status = 3) and off-chain.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Suspension test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 13: Prevention of Issuance by Suspended/Unauthorized Institution
    // ------------------------------------------------------------------------
    try {
      console.log('\n13. Testing Prevention of Issuance by Suspended Institution...');
      // Direct DB creation of temporary admin user for suspended test
      const User = require('../src/models/User');
      const tempHash = await User.hashPassword('SuspendedPassword2026!');
      const tempUser = await User.create({
        fullName: 'Suspended Dean',
        email: 'suspended.dean@apex.edu.test',
        passwordHash: tempHash,
        role: 'INSTITUTION_ADMIN',
        institutionCode: 'AIT',
        walletAddress: institutionWallet
      });

      const tempLogin = await makeRequest('POST', '/api/v2/auth/login', {
        email: 'suspended.dean@apex.edu.test',
        password: 'SuspendedPassword2026!'
      });
      const tempToken = tempLogin.body.token;

      const issueAttempt = await makeRequest(
        'POST',
        '/api/v2/institutions/issue',
        fictionalStudent,
        tempToken
      );
      assert.strictEqual(issueAttempt.statusCode, 403, 'Suspended institution issuance must return 403 Forbidden');
      assert.strictEqual(issueAttempt.body.success, false);

      passedCount++;
      console.log('   ✅ Unauthorized issuance blocked: 403 Forbidden enforced for suspended status.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Prevention of unauthorized issuance failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 14: Restoration of Institution Status to AUTHORIZED on Smart Contract
    // ------------------------------------------------------------------------
    try {
      console.log('\n14. Testing Restoration of Institution Status to AUTHORIZED...');
      const restoreRes = await makeRequest(
        'PATCH',
        `/api/v2/admin/institutions/${approvedInstId}/status`,
        { status: 'AUTHORIZED' },
        adminToken
      );
      assert.strictEqual(restoreRes.statusCode, 200);
      assert.strictEqual(restoreRes.body.institution.status, 'AUTHORIZED');

      const instOnChain = await directContractInstance.getInstitution(institutionWallet);
      assert.strictEqual(instOnChain.status, 2, 'Smart contract must restore status 2 (Authorized)');

      passedCount++;
      console.log('   ✅ Institution restored to AUTHORIZED on smart contract.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Status restoration failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 15: Protected Institution Admin Provisioning by Super Admin
    // ------------------------------------------------------------------------
    try {
      console.log('\n15. Testing Protected Institution Admin Provisioning by Super Admin...');
      const provRes = await makeRequest(
        'POST',
        `/api/v2/admin/institutions/${approvedInstId}/provision-admin`,
        {
          fullName: 'Dean of Academic Records',
          email: 'dean.records@apex.edu.test',
          password: 'DeanAcademicSecure2026!'
        },
        adminToken
      );

      assert.strictEqual(provRes.statusCode, 201);
      assert.strictEqual(provRes.body.user.role, 'INSTITUTION_ADMIN');
      assert.strictEqual(provRes.body.user.institutionCode, 'AIT');
      assert.strictEqual(provRes.body.user.walletAddress.toLowerCase(), institutionWallet.toLowerCase());

      // Login as the newly provisioned Institution Admin
      const loginInst = await makeRequest('POST', '/api/v2/auth/login', {
        email: 'dean.records@apex.edu.test',
        password: 'DeanAcademicSecure2026!'
      });
      assert.strictEqual(loginInst.statusCode, 200);
      instToken = loginInst.body.token;
      assert.ok(instToken, 'Institution Admin token must be issued');

      passedCount++;
      console.log('   ✅ Institution Administrator provisioned by Super Admin and authenticated.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Provision institution admin failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 16: Prevention of Institution Admin Provisioning by Non-Super Admin (403 Forbidden)
    // ------------------------------------------------------------------------
    try {
      console.log('\n16. Testing Prevention of Institution Admin Provisioning by Non-Super Admin...');
      const unauthProv = await makeRequest(
        'POST',
        `/api/v2/admin/institutions/${approvedInstId}/provision-admin`,
        {
          fullName: 'Rogue Admin',
          email: 'rogue.admin@apex.edu.test',
          password: 'RoguePassword123!'
        },
        studentToken
      );
      assert.strictEqual(unauthProv.statusCode, 403, 'Student must be rejected from provisioning administrators');

      passedCount++;
      console.log('   ✅ Unauthorized admin provisioning rejected with 403 Forbidden.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Non-super admin provisioning prevention failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 17: Prevention of Institution Admin Provisioning for Unaccredited Institution (400 Bad Request)
    // ------------------------------------------------------------------------
    try {
      console.log('\n17. Testing Prevention of Provisioning for Unaccredited Institution...');
      const badProv = await makeRequest(
        'POST',
        `/api/v2/admin/institutions/${offlineInstId}/provision-admin`,
        {
          fullName: 'Offline Dean',
          email: 'offline.dean@offline.edu.test',
          password: 'OfflinePassword123!'
        },
        adminToken
      );
      assert.strictEqual(badProv.statusCode, 400, 'Unaccredited institution must return 400 Bad Request');
      assert.ok(badProv.body.message.includes('must be accredited'));

      passedCount++;
      console.log('   ✅ Provisioning for unaccredited institution safely rejected with 400 Bad Request.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Unaccredited institution provisioning check failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 18: Negative RBAC: Student Blocked from Certificate Issuance (403 Forbidden)
    // ------------------------------------------------------------------------
    try {
      console.log('\n18. Testing Negative RBAC: Student Blocked from Certificate Issuance...');
      const studentIssue = await makeRequest(
        'POST',
        '/api/v2/institutions/issue',
        fictionalStudent,
        studentToken
      );
      assert.strictEqual(studentIssue.statusCode, 403, 'Student caller must be rejected from issuing certificates');

      passedCount++;
      console.log('   ✅ Student certificate issuance blocked with 403 Forbidden.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Student issuance prevention failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 19: Persistent Institutional Key Custody (AES-256-GCM via PBKDF2 & Database Signer)
    // ------------------------------------------------------------------------
    try {
      console.log('\n19. Testing Persistent Key Custody (AES-256-GCM via PBKDF2 & Database Signer)...');
      const testWallet = ethers.Wallet.createRandom();

      const testInstApp = await makeRequest('POST', '/api/v2/institutions/apply', {
        institutionCode: 'KMS',
        name: 'Key Custody Academy',
        officialDomain: 'kms.edu.test',
        contactEmail: 'security@kms.edu.test',
        walletAddress: testWallet.address
      });
      assert.strictEqual(testInstApp.statusCode, 201);

      // Store encrypted private key into MongoDB
      const storeRes = await KeyVaultService.storeInstitutionEncryptedKey('KMS', testWallet.privateKey);
      assert.strictEqual(storeRes.success, true);

      // Verify persistent fields in MongoDB
      const dbInst = await Institution.findOne({ institutionCode: 'KMS' });
      assert.ok(dbInst.encryptedPrivateKey, 'Ciphertext must be persisted in DB');
      assert.ok(dbInst.keyVaultIv, 'IV must be persisted in DB');
      assert.ok(dbInst.keyVaultTag, 'Auth tag must be persisted in DB');
      assert.notStrictEqual(dbInst.encryptedPrivateKey, testWallet.privateKey, 'Plaintext key must NEVER be stored');

      // Reset in-memory cache to ensure resolution queries DB directly
      KeyVaultService.resetVault();

      // Resolve signer from DB
      const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');
      const resolvedSigner = await KeyVaultService.getSigner(testWallet.address, provider);
      const resolvedAddr = await resolvedSigner.getAddress();
      assert.strictEqual(resolvedAddr.toLowerCase(), testWallet.address.toLowerCase());

      // Test cryptographic signature with resolved signer
      const sig = await resolvedSigner.signMessage('EMERTECH_KEY_VAULT_TEST');
      const recoveredAddr = ethers.utils.verifyMessage('EMERTECH_KEY_VAULT_TEST', sig);
      assert.strictEqual(recoveredAddr.toLowerCase(), testWallet.address.toLowerCase());

      passedCount++;
      console.log('   ✅ Key vault encrypted storage, DB retrieval, and cryptographic signing verified.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Persistent key custody test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 20: Real On-Chain Certificate Issuance Signed by Institution Signer
    // ------------------------------------------------------------------------
    try {
      console.log('\n20. Testing Certificate Issuance Signed by Institution & Real On-Chain Anchoring...');
      const issueRes = await makeRequest(
        'POST',
        '/api/v2/institutions/issue',
        fictionalStudent,
        instToken
      );

      assert.strictEqual(issueRes.statusCode, 201);
      const cert = issueRes.body.certificate;

      // Assert onChain === true and real transaction hash
      assert.strictEqual(cert.onChain, true, 'Certificate issuance must be onChain === true');
      assert.ok(cert.txHash, 'Transaction hash must be present');
      assert.match(cert.txHash, /^0x[a-fA-F0-9]{64}$/, 'txHash must be a valid 66-char Ethereum hex hash');
      assert.ok(!cert.txHash.includes('SIMULATED'), 'Simulated transaction must cause test failure');

      testCertHash = cert.certHash;
      testCertId = cert.certificateId;

      // Query contract directly on EVM to confirm minted state and verify issuer identity
      const onChainRecord = await directContractInstance.verifyCertificate(testCertHash);
      assert.strictEqual(onChainRecord.exists, true, 'Contract must confirm certificate exists on-chain');
      assert.strictEqual(onChainRecord.isRevoked, false, 'Contract must confirm certificate is not revoked');
      assert.match(onChainRecord.recipientIdHash, /^0x[a-fA-F0-9]{64}$/, 'recipientIdHash must be a salted SHA-256 digest');

      // CRITICAL ASSERTION: On-chain issuer identity matches the approved institution's wallet
      assert.strictEqual(
        onChainRecord.issuer.toLowerCase(),
        institutionWallet.toLowerCase(),
        'On-chain issuer must strictly match approved institution wallet (msg.sender)'
      );
      assert.strictEqual(cert.issuerWallet.toLowerCase(), institutionWallet.toLowerCase());
      assert.strictEqual(cert.onChainIssuer.toLowerCase(), institutionWallet.toLowerCase());

      passedCount++;
      console.log(`   ✅ Certificate anchored on-chain with confirmed EVM transaction!`);
      console.log(`      ID:     ${testCertId}`);
      console.log(`      Hash:   ${testCertHash}`);
      console.log(`      TxHash: ${cert.txHash}`);
      console.log(`      Issuer: ${onChainRecord.issuer} (Verified Matches Institution Wallet)`);
    } catch (err) {
      failedCount++;
      console.error('   ❌ On-chain certificate issuance failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 21: Vector PDF Download Endpoint
    // ------------------------------------------------------------------------
    try {
      console.log('\n21. Testing Vector PDF Download Endpoint...');
      const pdfRes = await makeRequest('GET', `/api/v2/certificates/${testCertId}/pdf`);
      assert.strictEqual(pdfRes.statusCode, 200);
      assert.strictEqual(pdfRes.headers['content-type'], 'application/pdf');
      assert.ok(pdfRes.binary && pdfRes.binary.length > 1000, 'PDF binary must be generated');
      passedCount++;
      console.log(`   ✅ Vector PDF downloaded successfully (${pdfRes.binary.length} bytes).`);
    } catch (err) {
      failedCount++;
      console.error('   ❌ PDF download failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 22: Mode 1: Public Verification by Hash with Verified On-Chain Issuer
    // ------------------------------------------------------------------------
    try {
      console.log('\n22. Testing Mode 1: Public Verification by Hash with On-Chain Issuer Display...');
      const verifyRes = await makeRequest('POST', '/api/v2/verify/hash', { hash: testCertHash });
      assert.strictEqual(verifyRes.statusCode, 200);
      assert.strictEqual(verifyRes.body.status, 'AUTHENTIC');
      assert.strictEqual(verifyRes.body.onChainVerified, true);
      assert.strictEqual(verifyRes.body.onChainIssuer.toLowerCase(), institutionWallet.toLowerCase());
      assert.strictEqual(verifyRes.body.verificationData.onChainIssuer.toLowerCase(), institutionWallet.toLowerCase());
      assert.strictEqual(verifyRes.body.verificationData.studentName, fictionalStudent.studentName);
      passedCount++;
      console.log('   ✅ Mode 1 Verified: Status = AUTHENTIC (onChainVerified: true, issuer matches institution).');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Mode 1 verification failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 23: Mode 2: Verification by PDF Binary Upload
    // ------------------------------------------------------------------------
    let authenticPdfBuffer = null;
    try {
      console.log('\n23. Testing Mode 2: Verification by PDF Binary Upload...');
      const pdfFetch = await makeRequest('GET', `/api/v2/certificates/${testCertId}/pdf`);
      authenticPdfBuffer = pdfFetch.binary;

      const verifyFileRes = await makeRequest(
        'POST',
        '/api/v2/verify/file',
        null,
        null,
        true,
        { certificatePdf: { buffer: authenticPdfBuffer, filename: `${testCertId}.pdf`, contentType: 'application/pdf' } }
      );

      assert.strictEqual(verifyFileRes.statusCode, 200);
      assert.strictEqual(verifyFileRes.body.status, 'AUTHENTIC');
      assert.strictEqual(verifyFileRes.body.onChainVerified, true);
      assert.strictEqual(verifyFileRes.body.tamperDetected, false);
      passedCount++;
      console.log('   ✅ Mode 2 Verified: Bitwise file digest matches (onChainVerified: true).');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Mode 2 verification failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 24: Bitwise Tamper Detection on Altered PDF Document
    // ------------------------------------------------------------------------
    try {
      console.log('\n24. Testing Bitwise Tamper Detection on Altered PDF Document...');
      const tamperedBuffer = Buffer.from(authenticPdfBuffer);
      tamperedBuffer[tamperedBuffer.length - 20] ^= 0xFF; // Flip bit in trailing byte

      const tamperRes = await makeRequest(
        'POST',
        '/api/v2/verify/file',
        null,
        null,
        true,
        {
          certificatePdf: { buffer: tamperedBuffer, filename: `${testCertId}_tampered.pdf`, contentType: 'application/pdf' },
          expectedCertificateId: testCertId
        }
      );

      assert.strictEqual(tamperRes.statusCode, 200);
      assert.strictEqual(tamperRes.body.status, 'TAMPER_DETECTED');
      assert.strictEqual(tamperRes.body.tamperDetected, true);
      assert.strictEqual(tamperRes.body.onChainVerified, false);
      passedCount++;
      console.log('   ✅ Tamper Detection Verified: Cryptographic mismatch flagged as TAMPER_DETECTED.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Tamper detection failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 25: Mode 3: QR Code Payload Verification
    // ------------------------------------------------------------------------
    try {
      console.log('\n25. Testing Mode 3: QR Code Payload Verification...');
      const qrPayload = `http://localhost:3000/verify?hash=${testCertHash}`;
      const qrRes = await makeRequest('POST', '/api/v2/verify/qr', { qrPayload });
      assert.strictEqual(qrRes.statusCode, 200);
      assert.strictEqual(qrRes.body.status, 'AUTHENTIC');
      assert.strictEqual(qrRes.body.onChainVerified, true);
      passedCount++;
      console.log('   ✅ Mode 3 Verified: QR payload successfully resolved on-chain.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ QR payload verification failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 26: Student Credential Retrieval (/api/v2/certificates/student/my-certificates)
    // ------------------------------------------------------------------------
    try {
      console.log('\n26. Testing Student Credential Retrieval (/api/v2/certificates/student/my-certificates)...');
      const studentCerts = await makeRequest('GET', '/api/v2/certificates/student/my-certificates', null, studentToken);
      assert.strictEqual(studentCerts.statusCode, 200);
      assert.strictEqual(studentCerts.body.success, true);
      assert.ok(studentCerts.body.certificates.length >= 1);
      passedCount++;
      console.log('   ✅ Student transcripts retrieved.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Student credential retrieval failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 27: Negative RBAC: Institution Admin Forbidden from Revoking Other Institution's Certificate
    // ------------------------------------------------------------------------
    try {
      console.log('\n27. Testing Negative RBAC: Institution Admin Forbidden from Cross-Institution Revocation...');
      const otherWallet = '0x90F79bf6EB2c4f870365E785982E1f101E93b906'; // Hardhat Account #3
      const otherInstApp = await makeRequest('POST', '/api/v2/institutions/apply', {
        institutionCode: 'OTHER',
        name: 'Other Technological University',
        officialDomain: 'other.edu.test',
        contactEmail: 'admin@other.edu.test',
        walletAddress: otherWallet
      });
      assert.strictEqual(otherInstApp.statusCode, 201);
      const otherInstId = otherInstApp.body.institution._id;

      // Authorize other institution on-chain
      const authOther = await makeRequest(
        'PATCH',
        `/api/v2/admin/institutions/${otherInstId}/status`,
        { status: 'AUTHORIZED' },
        adminToken
      );
      assert.strictEqual(authOther.statusCode, 200);

      // Provision admin for other institution
      const provOther = await makeRequest(
        'POST',
        `/api/v2/admin/institutions/${otherInstId}/provision-admin`,
        {
          fullName: 'Other Admin',
          email: 'admin@other.edu.test',
          password: 'OtherPassword2026!'
        },
        adminToken
      );
      assert.strictEqual(provOther.statusCode, 201);

      // Login as other admin
      const otherLogin = await makeRequest('POST', '/api/v2/auth/login', {
        email: 'admin@other.edu.test',
        password: 'OtherPassword2026!'
      });
      assert.strictEqual(otherLogin.statusCode, 200);
      const otherToken = otherLogin.body.token;

      // Attempt to revoke AIT's certificate using OTHER admin's token
      const crossRevoke = await makeRequest(
        'POST',
        '/api/v2/institutions/revoke',
        { certHash: testCertHash, reason: 'Cross-institution attack attempt' },
        otherToken
      );
      assert.strictEqual(crossRevoke.statusCode, 403, 'Cross-institution revocation must return 403 Forbidden');
      assert.ok(crossRevoke.body.message.includes('own institution'));

      passedCount++;
      console.log('   ✅ Multi-tenant isolation verified: Cross-institution revocation rejected with 403 Forbidden.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Cross-institution revocation isolation failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 28: Real On-Chain Certificate Revocation by Issuing Institution
    // ------------------------------------------------------------------------
    try {
      console.log('\n28. Testing Real On-Chain Certificate Revocation by Issuing Institution...');
      const revokeRes = await makeRequest(
        'POST',
        '/api/v2/institutions/revoke',
        { certHash: testCertHash, reason: 'Degree classification updated following thesis re-evaluation' },
        instToken
      );

      assert.strictEqual(revokeRes.statusCode, 200);
      assert.strictEqual(revokeRes.body.certificate.isRevoked, true);
      assert.strictEqual(revokeRes.body.certificate.onChain, true, 'Revocation must be onChain === true');
      assert.match(revokeRes.body.certificate.txHash, /^0x[a-fA-F0-9]{64}$/, 'txHash must be valid Ethereum hash');

      // Verify on-chain revocation state directly on EVM
      const onChainCheck = await directContractInstance.verifyCertificate(testCertHash);
      assert.strictEqual(onChainCheck.isRevoked, true, 'Smart contract must confirm isRevoked === true');

      passedCount++;
      console.log('   ✅ Certificate revoked via real mined smart contract transaction by issuing institution.');
      console.log(`      Revocation TxHash: ${revokeRes.body.certificate.txHash}`);
    } catch (err) {
      failedCount++;
      console.error('   ❌ Revocation test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 29: Prevention of Unauthorized Revocation by Non-Issuer / Student
    // ------------------------------------------------------------------------
    try {
      console.log('\n29. Testing Prevention of Unauthorized Revocation by Student...');
      const unauthRevoke = await makeRequest(
        'POST',
        '/api/v2/institutions/revoke',
        { certHash: testCertHash, reason: 'Malicious student revocation attempt' },
        studentToken
      );
      assert.strictEqual(unauthRevoke.statusCode, 403, 'Non-institution caller must be rejected with 403');

      passedCount++;
      console.log('   ✅ Unauthorized revocation rejected with 403 Forbidden.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Unauthorized revocation prevention failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 30: Public Verification of Revoked Credential
    // ------------------------------------------------------------------------
    try {
      console.log('\n30. Testing Public Verification of Revoked Credential...');
      const revokedVerify = await makeRequest('POST', '/api/v2/verify/hash', { hash: testCertHash });
      assert.strictEqual(revokedVerify.statusCode, 200);
      assert.strictEqual(revokedVerify.body.status, 'REVOKED');
      assert.strictEqual(revokedVerify.body.onChainVerified, true);
      passedCount++;
      console.log('   ✅ Revocation confirmed: Status = REVOKED directly from smart contract.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Revoked verification failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 31: Mode 4: Tesseract.js Neural OCR Image Extraction with Fixture
    // ------------------------------------------------------------------------
    try {
      console.log('\n31. Testing Mode 4: Tesseract.js Neural OCR Image Extraction (Synthetic Fixture)...');
      const samplePngPath = path.resolve(__dirname, 'fixtures/synthetic-test-certificate.png');

      if (!fs.existsSync(samplePngPath)) {
        assert.fail(`Mandatory synthetic OCR fixture missing: ${samplePngPath}`);
      }

      const imgBuffer = fs.readFileSync(samplePngPath);
      const ocrRes = await makeRequest(
        'POST',
        '/api/v2/verify/ocr',
        null,
        null,
        true,
        { imageFile: { buffer: imgBuffer, filename: 'synthetic-test-certificate.png', contentType: 'image/png' } }
      );

      assert.strictEqual(ocrRes.statusCode, 200);
      assert.strictEqual(ocrRes.body.success, true);
      assert.ok(ocrRes.body.disclaimer);
      assert.strictEqual(ocrRes.body.parsedEntities.detectedStudentName, 'Jane H. Doe');
      assert.strictEqual(ocrRes.body.parsedEntities.detectedStudentId, 'STU-2026-0042');
      assert.strictEqual(ocrRes.body.matchFound, true, 'OCR parsed student ID must match database record');

      passedCount++;
      console.log('   ✅ Mode 4 Verified: Tesseract.js OCR successfully extracted entities from synthetic fixture.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Mode 4 OCR test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 32: File Upload Magic Byte Enforcement (Rejection of Non-PDF & Non-Image)
    // ------------------------------------------------------------------------
    try {
      console.log('\n32. Testing File Upload Magic Byte Enforcement (Rejection of Non-PDF & Non-Image)...');
      const fakePdfBuffer = Buffer.from('NOT_A_REAL_PDF_DOCUMENT_HEADER_DATA');
      const badFileRes = await makeRequest(
        'POST',
        '/api/v2/verify/file',
        null,
        null,
        true,
        { certificatePdf: { buffer: fakePdfBuffer, filename: 'fake.pdf', contentType: 'application/pdf' } }
      );
      assert.strictEqual(badFileRes.statusCode, 400, 'Non-PDF file must be rejected with 400');
      assert.ok(badFileRes.body.message.includes('PDF header signature'));

      const fakeImgBuffer = Buffer.from('NOT_AN_IMAGE_HEADER_DATA');
      const badImgRes = await makeRequest(
        'POST',
        '/api/v2/verify/ocr',
        null,
        null,
        true,
        { imageFile: { buffer: fakeImgBuffer, filename: 'fake.png', contentType: 'image/png' } }
      );
      assert.strictEqual(badImgRes.statusCode, 400, 'Non-image file must be rejected with 400');
      assert.ok(badImgRes.body.message.includes('PNG or JPEG signature'));

      passedCount++;
      console.log('   ✅ Magic byte validation verified: Invalid binary headers rejected with 400 Bad Request.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Magic byte validation failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 33: Batch Certificate Issuance with Real On-Chain Registration & Institutional Signatures
    // ------------------------------------------------------------------------
    try {
      console.log('\n33. Testing Batch Certificate Issuance with Real On-Chain Registration...');
      const batchRes = await makeRequest(
        'POST',
        '/api/v2/institutions/batch',
        {
          batch: [
            { studentName: 'Carlos Gomez', studentIdentifier: 'STU-2026-0043', degreeTitle: 'B.S.', majorProgram: 'Computer Engineering' },
            { studentName: 'Fatima Al-Mansoor', studentIdentifier: 'STU-2026-0044', degreeTitle: 'B.S.', majorProgram: 'Computer Engineering' }
          ]
        },
        instToken
      );
      assert.strictEqual(batchRes.statusCode, 200);
      assert.strictEqual(batchRes.body.processed, 2);
      assert.strictEqual(batchRes.body.results[0].onChain, true);
      assert.strictEqual(batchRes.body.results[1].onChain, true);
      assert.strictEqual(batchRes.body.results[0].onChainIssuer.toLowerCase(), institutionWallet.toLowerCase());
      assert.strictEqual(batchRes.body.results[1].onChainIssuer.toLowerCase(), institutionWallet.toLowerCase());
      passedCount++;
      console.log('   ✅ Batch issuance processed 2 certificates with real on-chain transactions and institutional signatures.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Batch issuance test failed:', err.message);
      throw err;
    }

    // ------------------------------------------------------------------------
    // TEST 34: Super Admin Telemetry & Governance Metrics
    // ------------------------------------------------------------------------
    try {
      console.log('\n34. Testing Super Admin Telemetry & Governance Metrics...');
      const telemRes = await makeRequest('GET', '/api/v2/admin/telemetry', null, adminToken);
      assert.strictEqual(telemRes.statusCode, 200);
      assert.strictEqual(telemRes.body.success, true);
      assert.ok(telemRes.body.telemetry.totalCertificates >= 3);
      passedCount++;
      console.log('   ✅ Super Admin telemetry verified.');
    } catch (err) {
      failedCount++;
      console.error('   ❌ Admin telemetry test failed:', err.message);
      throw err;
    }

  } finally {
    if (server) {
      server.close();
    }
    await disconnectDatabase();
    if (hardhatNodeProcess) {
      console.log('\n[Blockchain Teardown] Terminating local Hardhat node...');
      hardhatNodeProcess.kill();
    }
  }

  console.log('\n================================================================');
  console.log('📊 CLEAN-ROOM v2.0 TEST EXECUTION SUMMARY:');
  console.log(`   Passed:  ${passedCount}`);
  console.log(`   Failed:  ${failedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL CLEAN-ROOM TESTS PASSED WITH 100% SUCCESS ON REAL EVM LEDGER!\n');
    process.exit(0);
  }
}

runCleanroomTestSuite().catch((err) => {
  console.error('\nFatal test execution error:', err);
  process.exit(1);
});
