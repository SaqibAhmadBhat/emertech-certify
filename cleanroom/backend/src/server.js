const app = require('./app');
const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/db');

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

    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        try {
          await disconnectDatabase();
          console.log('[Server] Database disconnected. Graceful shutdown complete.');
          process.exit(0);
        } catch (dbErr) {
          console.error('[Server Error] Error during database disconnect:', dbErr.message);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if hanging
      setTimeout(() => {
        console.error('[Server] Forced shutdown timeout exceeded.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

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
