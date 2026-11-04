const mongoose = require('mongoose');
const config = require('./env');

let memoryServer = null;

function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '[REDACTED]';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

async function connectDatabase() {
  const isRemote = config.mongoUri.includes('+srv') || (!config.mongoUri.includes('127.0.0.1') && !config.mongoUri.includes('localhost'));
  const timeoutMs = isRemote ? 10000 : 2000;

  try {
    mongoose.set('strictQuery', false);
    // Attempt standard connection
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: timeoutMs
    });
    console.log(`[Database] Connected to external MongoDB at ${sanitizeMongoUri(config.mongoUri)}`);
  } catch (err) {
    if (config.nodeEnv === 'production' && isRemote) {
      console.error(`[Database Error] Failed to connect to production MongoDB (${sanitizeMongoUri(config.mongoUri)}):`, err.message);
      throw err;
    }

    console.warn('[Database] External MongoDB connection unavailable. Initializing embedded in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Embedded in-memory MongoDB started at ${sanitizeMongoUri(memUri)}`);
    } catch (memErr) {
      console.error('[Database] Failed to start embedded database:', memErr.message);
      throw memErr;
    }
  }
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  sanitizeMongoUri
};
