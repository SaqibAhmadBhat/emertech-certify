const mongoose = require('mongoose');
const config = require('./env');

let memoryServer = null;

async function connectDatabase() {
  try {
    mongoose.set('strictQuery', false);
    // Attempt standard connection
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[Database] Connected to external MongoDB at ${config.mongoUri}`);
  } catch (err) {
    console.warn('[Database] External MongoDB connection unavailable. Initializing embedded in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Embedded in-memory MongoDB started at ${memUri}`);
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
  disconnectDatabase
};
