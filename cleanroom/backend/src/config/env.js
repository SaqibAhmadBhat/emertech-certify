const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isTestMode = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'));
const nodeEnv = isTestMode ? 'test' : (process.env.NODE_ENV || 'development');
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const isLocalNetwork = rpcUrl.includes('127.0.0.1') || rpcUrl.includes('localhost');

// 1. JWT Secret Validation: fail safely if missing in non-test mode
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isTestMode) {
    // Generate an ephemeral random secret for test isolation
    jwtSecret = crypto.randomBytes(32).toString('hex');
  } else {
    throw new Error('Configuration Error: JWT_SECRET environment variable is required. Please set a secure key in .env.');
  }
}

// 2. Key Vault Secret Validation: strictly independent from JWT_SECRET
let keyVaultSecret = process.env.KEY_VAULT_SECRET;
if (!keyVaultSecret) {
  if (isTestMode) {
    keyVaultSecret = crypto.randomBytes(32).toString('hex');
  } else if (nodeEnv === 'production') {
    throw new Error('Configuration Error: KEY_VAULT_SECRET environment variable is required in production.');
  } else {
    keyVaultSecret = 'emertech_dev_vault_master_key_secret_2026_unrestricted';
  }
}

// 3. Private Key Validation: prevent development key on public networks via hash-based deny-list
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY ? process.env.DEPLOYER_PRIVATE_KEY.trim() : '';
// SHA-256 hashes of known development account #0 private key (with and without 0x prefix)
const KNOWN_DEV_KEY_SHA256 = new Set([
  '60a09e4357868c1e9b801052726d061c370429f723db84523ed58ac354f6eb8a',
  'bc1a50966c9e6486bc4ebf880b51611a2a97fcb8e7a6976e9b81a9e3e8ca0e3c'
]);

if (deployerPrivateKey) {
  const normalizedKey = deployerPrivateKey.toLowerCase();
  const keyHash = crypto.createHash('sha256').update(normalizedKey).digest('hex');
  if (KNOWN_DEV_KEY_SHA256.has(keyHash) && !isLocalNetwork) {
    throw new Error('Security Violation: Known Hardhat development private key cannot be used on non-local networks.');
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv,
  isTestMode,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/emertech_certify_cleanroom',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  keyVaultSecret,
  rpcUrl,
  contractAddress: process.env.CONTRACT_ADDRESS ? process.env.CONTRACT_ADDRESS.trim() : '',
  deployerPrivateKey,
  isLocalNetwork,
  storageDir: path.resolve(__dirname, '../../storage'),
  pinataApiKey: process.env.PINATA_API_KEY || '',
  pinataSecretKey: process.env.PINATA_SECRET_KEY || ''
};

module.exports = config;
