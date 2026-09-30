import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get('/stats', async (_req, res) => {
  const users = await prisma.user.findMany();
  const inbounds = await prisma.inbound.findMany();

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
    totalInbounds: inbounds.length,
    serverStatus: 'Healthy',
  });
});
