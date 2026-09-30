import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  trafficLimit: z.number().int().min(0).default(0),
  expiryDate: z.string().nullable().optional(),
  protocol: z.string().default('VLESS'),
  status: z.enum(['ACTIVE', 'DISABLED', 'EXPIRED']).default('ACTIVE'),
  connections: z.number().int().min(1).default(1),
  online: z.boolean().default(false),
  subscriptionUrl: z.string().optional(),
  qrCodeUrl: z.string().optional(),
  configLink: z.string().optional(),
});

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return res.json(users);
});

usersRouter.post('/', async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const hash = await import('bcryptjs').then((m) => m.default.hash(parsed.data.password, 10));

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash: hash,
      status: parsed.data.status,
      trafficLimit: parsed.data.trafficLimit,
      trafficRemaining: parsed.data.trafficLimit,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      protocol: parsed.data.protocol,
      connections: parsed.data.connections,
      online: parsed.data.online,
      subscriptionUrl: parsed.data.subscriptionUrl,
      qrCodeUrl: parsed.data.qrCodeUrl,
      configLink: parsed.data.configLink,
    },
  });

  return res.status(201).json(user);
});

usersRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.update({
    where: { id },
    data: {
      username: req.body.username,
      trafficLimit: req.body.trafficLimit,
      status: req.body.status,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      online: req.body.online,
      connections: req.body.connections,
      protocol: req.body.protocol,
      subscriptionUrl: req.body.subscriptionUrl,
      configLink: req.body.configLink,
      qrCodeUrl: req.body.qrCodeUrl,
    },
  });

  return res.json(user);
});

usersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id } });
  return res.json({ success: true });
});

usersRouter.post('/:id/reset-traffic', async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id },
    data: {
      trafficUsed: 0,
      trafficRemaining: 0,
    },
  });

  return res.json(user);
});

usersRouter.post('/:id/toggle-status', async (req, res) => {
  const { id } = req.params;
  const current = await prisma.user.findUnique({ where: { id } });

  if (!current) {
    return res.status(404).json({ error: 'User not found' });
  }

  const nextStatus = current.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

  const user = await prisma.user.update({
    where: { id },
    data: { status: nextStatus },
  });

  return res.json(user);
});

usersRouter.get('/stats', async (_req, res) => {
  const users = await prisma.user.findMany();
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const disabledUsers = users.filter((u) => u.status === 'DISABLED').length;
  const expiredUsers = users.filter((u) => u.status === 'EXPIRED').length;
  const onlineUsers = users.filter((u) => u.online).length;
  const totalTraffic = users.reduce((sum, user) => sum + user.trafficUsed, 0);

  return res.json({
    totalUsers,
    activeUsers,
    disabledUsers,
    expiredUsers,
    onlineUsers,
    totalTraffic,
  });
});
