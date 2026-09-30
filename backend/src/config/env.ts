import { config } from 'dotenv';

config();

export const env = {
  PORT: Number(process.env.PORT ?? 8080),
  HOST: process.env.HOST ?? '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/pompnet?schema=public',
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? 'ChangeMe123!',
};
