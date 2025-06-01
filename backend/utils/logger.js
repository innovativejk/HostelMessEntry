// backend/utils/logger.js

const isDevelopment = process.env.NODE_ENV !== 'production';

export const info = (message, context = {}) => {
  if (isDevelopment) {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, context);
  } else {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, context);
  }
};

export const warn = (message, context = {}) => {
  console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context);
};

export const error = (message, err, context = {}) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, context);
  console.error(err); // Full error object for debugging
};