const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = require('../src/config/env');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');

function validatePasswordPolicy(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Bootstrap Error: Password is required.');
  }
  if (password.length < 12) {
    throw new Error('Bootstrap Error: Password must be at least 12 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Bootstrap Error: Password must contain at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Bootstrap Error: Password must contain at least one lowercase letter (a-z).');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Bootstrap Error: Password must contain at least one number (0-9).');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    throw new Error('Bootstrap Error: Password must contain at least one special character.');
  }
}

function promptInteractive(question, isSecret = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    if (isSecret && process.stdin.isTTY) {
      process.stdout.write(question);
      let input = '';
      const onData = (char) => {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            process.stdin.removeListener('data', onData);
            break;
          default:
            input += char;
            break;
        }
      };
      process.stdin.on('data', onData);
      rl.question('', () => {
        rl.close();
        console.log('');
        resolve(input.trim());
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/**
 * Executes one-time Super Administrator bootstrap.
 * Accepts credentials from options (programmatic test calls) or environment variables.
 * Command-line arguments for passwords are intentionally rejected for security (preventing ps inspection).
 */
async function bootstrapSuperAdmin(options = {}) {
  // Reject command-line arguments if passed to protect against process inspection
  if (process.argv.length > 2) {
    const msg = 'Security Violation: Passing credentials via command-line arguments is prohibited to prevent process inspection. Use environment variables (BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD) or interactive prompt.';
    if (options.throwOnError) throw new Error(msg);
    return { success: false, reason: 'ARGV_PASSWORDS_PROHIBITED', error: msg };
  }

  let email = options.email !== undefined ? options.email : process.env.BOOTSTRAP_ADMIN_EMAIL;
  let password = options.password !== undefined ? options.password : process.env.BOOTSTRAP_ADMIN_PASSWORD;
  let fullName = options.fullName !== undefined ? options.fullName : process.env.BOOTSTRAP_ADMIN_NAME;

  // If interactive TTY and credentials missing, prompt operator (never prompt in test mode)
  if ((!email || !password) && process.stdin.isTTY && process.env.NODE_ENV !== 'test') {
    console.log('\n--- Emertech Certify: Super Administrator Genesis Bootstrap ---');
    if (!email) {
      email = await promptInteractive('Enter Super Administrator Email: ');
    }
    if (!fullName) {
      fullName = await promptInteractive('Enter Full Name (e.g. Lead Governance Architect): ');
    }
    if (!password) {
      password = await promptInteractive('Enter Secure Password (min 12 chars, upper, lower, digit, special): ', true);
    }
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    const msg = 'Bootstrap Error: Operator email is required. Provide BOOTSTRAP_ADMIN_EMAIL environment variable.';
    if (options.throwOnError) throw new Error(msg);
    return { success: false, reason: 'MISSING_CREDENTIALS', error: msg };
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    const msg = 'Bootstrap Error: Operator password is required. Provide BOOTSTRAP_ADMIN_PASSWORD environment variable.';
    if (options.throwOnError) throw new Error(msg);
    return { success: false, reason: 'MISSING_CREDENTIALS', error: msg };
  }

  const cleanEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    const msg = 'Bootstrap Error: Invalid email format.';
    if (options.throwOnError) throw new Error(msg);
    return { success: false, reason: 'INVALID_EMAIL', error: msg };
  }

  // Validate strong password policy
  try {
    validatePasswordPolicy(password);
  } catch (pwErr) {
    if (options.throwOnError) throw pwErr;
    return { success: false, reason: 'PASSWORD_TOO_WEAK', error: pwErr.message };
  }

  const cleanFullName = (fullName && fullName.trim()) || 'Platform Governance Administrator';

  // Atomic database check: exactly ONE super administrator can ever exist
  const existingAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
  if (existingAdmin) {
    const msg = `Bootstrap Error: A Super Administrator already exists (${existingAdmin.email}). One-time setup can only be executed once.`;
    if (options.throwOnError) throw new Error(msg);
    return { success: false, reason: 'SUPER_ADMIN_ALREADY_EXISTS', count: 1, error: msg };
  }

  // Hash password using bcrypt
  const passwordHash = await User.hashPassword(password);

  // Attempt creation protected by atomic database unique partial index
  let admin;
  try {
    admin = await User.create({
      fullName: cleanFullName,
      email: cleanEmail,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true
    });
  } catch (dbErr) {
    if (dbErr.code === 11000) {
      const msg = 'Bootstrap Error: Concurrent bootstrap detected. Exactly one Super Administrator is permitted.';
      if (options.throwOnError) throw new Error(msg);
      return { success: false, reason: 'SUPER_ADMIN_ALREADY_EXISTS', error: msg };
    }
    throw dbErr;
  }

  // Log genesis event to audit trail
  try {
    await AuditLog.create({
      eventType: 'ADMIN_PROVISIONED',
      actorId: admin._id,
      actorEmail: admin.email,
      actorRole: 'SUPER_ADMIN',
      clientIp: '127.0.0.1',
      diagnosticDetails: {
        action: 'BOOTSTRAP_SUPER_ADMIN_GENESIS',
        email: admin.email,
        method: 'CLI_BOOTSTRAP_SECURE'
      }
    });
  } catch (auditErr) {
    // Non-fatal if audit log fails
  }

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
  if (process.argv.length > 2) {
    console.error('\n❌ [Security Violation] Passing credentials via command-line arguments is prohibited to prevent process inspection. Use environment variables (BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD) or interactive prompt.');
    process.exit(1);
  }

  let connected = false;
  try {
    const mongoUri = config.mongoUri;
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 });
    connected = true;
    console.log(`[Bootstrap] Connected to database: ${mongoUri}`);

    const result = await bootstrapSuperAdmin({ throwOnError: true });
    if (!result || !result.success) {
      throw new Error(result ? result.error || result.reason : 'Unknown bootstrap failure');
    }
    console.log('[Bootstrap] One-time setup completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ [Bootstrap Failed] ${err.message}`);
    if (connected && mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch (e) {}
    }
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = { bootstrapSuperAdmin, validatePasswordPolicy };
