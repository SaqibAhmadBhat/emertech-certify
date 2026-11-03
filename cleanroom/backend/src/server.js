const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('./config/db');

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      console.log('========================================================');
      console.log('🚀 EMERTECH CERTIFY — CLEAN-ROOM BACKEND ONLINE');
      console.log(`📡 Listening on Port: ${config.port}`);
      console.log(`👨‍💻 Lead Architect: Saqib Ahmad Bhat`);
      console.log(`🏛️ Institution: Government College of Engineering, Tirunelveli`);
      console.log('========================================================');
    });

    return server;
  } catch (err) {
    console.error('[Server Error] Startup failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
