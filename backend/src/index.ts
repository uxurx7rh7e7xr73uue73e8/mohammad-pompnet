import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { authRouter, ensureDefaultAdmin } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { usersRouter } from './routes/users.js';
import { inboundsRouter } from './routes/inbounds.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../public');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',');

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'PompNet API', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'connected', service: 'PompNet API' });
  } catch (error) {
    res.status(500).json({ ok: false, db: 'disconnected', error: 'Database unavailable' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);
app.use('/api/inbounds', inboundsRouter);

app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  return res.sendFile(path.join(distPath, 'index.html'));
});

async function bootstrap() {
  await ensureDefaultAdmin();

  app.listen(env.PORT, env.HOST, () => {
    console.log(`PompNet server listening on http://${env.HOST}:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to boot PompNet backend:', error);
  process.exit(1);
});
