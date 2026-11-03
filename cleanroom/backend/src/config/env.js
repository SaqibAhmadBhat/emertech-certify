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

// 2. Private Key Validation: prevent development key on public networks
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY ? process.env.DEPLOYER_PRIVATE_KEY.trim() : '';
const KNOWN_HARDHAT_ACCOUNT_0 = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'.toLowerCase();

if (deployerPrivateKey && deployerPrivateKey.toLowerCase() === KNOWN_HARDHAT_ACCOUNT_0 && !isLocalNetwork) {
  throw new Error('Security Violation: Known Hardhat development private key cannot be used on non-local networks.');
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv,
  isTestMode,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/emertech_certify_cleanroom',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  rpcUrl,
  contractAddress: process.env.CONTRACT_ADDRESS ? process.env.CONTRACT_ADDRESS.trim() : '',
  deployerPrivateKey,
  isLocalNetwork,
  storageDir: path.resolve(__dirname, '../../storage'),
  pinataApiKey: process.env.PINATA_API_KEY || '',
  pinataSecretKey: process.env.PINATA_SECRET_KEY || ''
};

module.exports = config;
