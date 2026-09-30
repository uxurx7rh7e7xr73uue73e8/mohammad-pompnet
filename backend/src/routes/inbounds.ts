import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const inboundSchema = z.object({
  name: z.string().min(1),
  protocol: z.string().default('VLESS'),
  port: z.number().int().min(1).max(65535),
  status: z.enum(['ACTIVE', 'DISABLED', 'EXPIRED']).default('ACTIVE'),
  trafficLimit: z.number().int().min(0).default(0),
  trafficUsed: z.number().int().min(0).default(0),
});

export const inboundsRouter = Router();
inboundsRouter.use(requireAuth);

inboundsRouter.get('/', async (_req, res) => {
  const inbounds = await prisma.inbound.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(inbounds);
});

inboundsRouter.post('/', async (req, res) => {
  const parsed = inboundSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const inbound = await prisma.inbound.create({ data: parsed.data });
  return res.status(201).json(inbound);
});

inboundsRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;

  const inbound = await prisma.inbound.update({
    where: { id },
    data: {
      name: req.body.name,
      protocol: req.body.protocol,
      port: req.body.port,
      status: req.body.status,
      trafficLimit: req.body.trafficLimit,
      trafficUsed: req.body.trafficUsed,
    },
  });

  return res.json(inbound);
});

inboundsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.inbound.delete({ where: { id } });
  return res.json({ success: true });
});
