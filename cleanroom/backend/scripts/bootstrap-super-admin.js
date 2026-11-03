const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = require('../src/config/env');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');

async function bootstrapSuperAdmin(options = {}) {
  const email = options.email || process.env.BOOTSTRAP_ADMIN_EMAIL || process.argv[2] || 'admin@emertech.org';
  const password = options.password || process.env.BOOTSTRAP_ADMIN_PASSWORD || process.argv[3] || 'SuperAdmin2026!Secure';
  const fullName = options.fullName || process.env.BOOTSTRAP_ADMIN_NAME || process.argv[4] || 'Saqib Ahmad Bhat (Lead Architect)';

  const count = await User.countDocuments({ role: 'SUPER_ADMIN' });
  if (count > 0) {
    console.log(`[Bootstrap] One-time setup already completed. Found ${count} existing SUPER_ADMIN account(s). Action aborted.`);
    return { success: false, reason: 'SUPER_ADMIN_ALREADY_EXISTS', count };
  }

  if (password.length < 8) {
    throw new Error('[Bootstrap] Password must be at least 8 characters long.');
  }

  const passwordHash = await User.hashPassword(password);
  const admin = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'SUPER_ADMIN',
    isActive: true
  });

  await AuditLog.create({
    eventType: 'ADMIN_PROVISIONED',
    actorId: admin._id,
    actorEmail: admin.email,
    actorRole: 'SUPER_ADMIN',
    clientIp: '127.0.0.1',
    diagnosticDetails: {
      action: 'BOOTSTRAP_SUPER_ADMIN',
      email: admin.email,
      createdVia: 'CLI_BOOTSTRAP'
    }
  });

  console.log(`[Bootstrap] Successfully created Super Administrator: ${admin.email} (ID: ${admin._id})`);
  return {
    success: true,
    user: {
      id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role
    }
  };
}

async function runCli() {
  try {
    const mongoUri = config.mongoUri;
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`[Bootstrap] Connected to database: ${mongoUri}`);

    const result = await bootstrapSuperAdmin();
    await mongoose.disconnect();
    console.log('[Bootstrap] Database disconnected. Bootstrap completed successfully.');
    process.exit(result.success ? 0 : 0);
  } catch (err) {
    console.error('[Bootstrap Error]', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = { bootstrapSuperAdmin };
