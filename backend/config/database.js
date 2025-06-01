import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import * as logger from '../utils/logger.js';

dotenv.config();

let db;

export const connectDB = async () => {
  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });
    await db.query('SELECT 1');
    logger.info('✅ MySQL database connected successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to MySQL database:', error);
    process.exit(1);
  }
};

export const getDB = () => {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
};