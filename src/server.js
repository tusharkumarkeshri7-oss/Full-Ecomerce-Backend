import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

let server;

// Handle uncaught exceptions before any server init
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down immediately...', err);
  process.exit(1);
});

const startServer = async () => {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Start HTTP Server
    server = app.listen(env.port, () => {
      logger.info(`====================================================`);
      logger.info(`🚀 ${env.appName} running in [${env.nodeEnv.toUpperCase()}] mode`);
      logger.info(`📡 Server listening on: http://localhost:${env.port}`);
      logger.info(`📚 Swagger Docs: http://localhost:${env.port}${env.apiPrefix}/docs`);
      logger.info(`🩺 Health Check: http://localhost:${env.port}${env.apiPrefix}/health`);
      logger.info(`💳 Payment Provider: ${env.payment.provider.toUpperCase()}`);
      logger.info(`====================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  logger.warn(`Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      logger.info('Graceful shutdown completed successfully.');
      process.exit(0);
    });

    // Force shutdown after 10s if hanging
    setTimeout(() => {
      logger.error('Forceful shutdown triggered after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION! Shutting down gracefully...', { reason });
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

startServer();
