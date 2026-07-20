import dotenv from 'dotenv';

dotenv.config({ path: ['src/config/.env'] });

export default {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ziplink',
  DATABASE_NAME: process.env.DATABASE_NAME || 'ziplink',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || 'super_secret_refresh_hmac',
  NODE_ENV: process.env.NODE_ENV || 'development',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
};
