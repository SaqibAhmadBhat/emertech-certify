const mongoose = require('mongoose');

let mongoServer = null;

/**
 * Connect to MongoDB with automated fallback to in-memory server
 * for zero-friction local academic demonstrations.
 */
const connectDB = async (customUri) => {
  const uri = customUri || process.env.MONGO_URI;

  // 1. If explicit URI is provided (Atlas or custom)
  if (uri) {
    try {
      await mongoose.connect(uri);
      console.log('✅ Connected to MongoDB via URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
      return;
    } catch (err) {
      console.warn(`⚠️ Failed to connect to specified MONGO_URI (${err.message}). Attempting fallback...`);
    }
  }

  // 2. Try default local daemon (mongodb://127.0.0.1:27017/emertech_certify)
  const defaultLocal = 'mongodb://127.0.0.1:27017/emertech_certify';
  try {
    const conn = await mongoose.connect(defaultLocal, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to local MongoDB daemon (127.0.0.1:27017/emertech_certify)');
    return;
  } catch (err) {
    // Local daemon not active; fallback to in-memory server
    console.log('ℹ️ Local MongoDB daemon not detected. Initializing embedded in-memory MongoDB server...');
  }

  // 3. Automated In-Memory Fallback using mongodb-memory-server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    await mongoose.connect(memoryUri);
    console.log('✅ Embedded in-memory MongoDB initialized successfully at:', memoryUri);
    console.log('ℹ️ Running in self-contained demonstration mode (no external database required).');
  } catch (memErr) {
    console.error('❌ Failed to initialize embedded MongoDB fallback:', memErr.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
