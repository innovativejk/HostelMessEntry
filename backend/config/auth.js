import dotenv from 'dotenv';
dotenv.config();

export const jwtSecret = process.env.JWT_SECRET || 'your_fallback_secret';
export const jwtExpiration = process.env.JWT_EXPIRATION || '1h';