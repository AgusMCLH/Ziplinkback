import dotenv from 'dotenv';

dotenv.config({ path: ['src/config/.env'] });

const required = ['JWT_SECRET', 'APIKEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ziplink',
  DATABASE_NAME: process.env.DATABASE_NAME || 'ziplink',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'super_secret_refresh_hmac',
  APIKEY: process.env.APIKEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
  SESSION_TTL_MS: parseInt(process.env.SESSION_TTL_MS || String(7 * 24 * 60 * 60 * 1000), 10),
};
