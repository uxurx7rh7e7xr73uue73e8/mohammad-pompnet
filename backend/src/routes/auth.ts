import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid username or password format' });
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      status: user.status,
    },
  });
});

export async function ensureDefaultAdmin() {
  const existing = await prisma.user.findUnique({ where: { username: env.ADMIN_USERNAME } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

    await prisma.user.create({
      data: {
        username: env.ADMIN_USERNAME,
        passwordHash,
        status: 'ACTIVE',
        trafficLimit: 0,
        trafficRemaining: 0,
        protocol: 'VLESS',
        online: true,
        connections: 3,
      },
    });
  }
}
