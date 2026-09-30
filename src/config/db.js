import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let mongodInstance = null;

/**
 * Connect to MongoDB database
 * Supports MongoDB URI or automatic in-memory fallback for local dev & testing
 */
export const connectDB = async () => {
  let uri = env.mongodbUri;

  if (uri === 'memory') {
    logger.info('Initializing MongoDB In-Memory Server...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    uri = mongodInstance.getUri();
    logger.info(`In-Memory MongoDB started at: ${uri}`);
  }

  const mongooseOptions = {
    autoIndex: !env.isProduction,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  };

  try {
    const conn = await mongoose.connect(uri, mongooseOptions);
    logger.info(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected.');
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failure: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB and stop in-memory server if running
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    logger.info('MongoDB disconnected gracefully.');
  } catch (error) {
    logger.error('Error during MongoDB disconnection:', error);
  }
};
