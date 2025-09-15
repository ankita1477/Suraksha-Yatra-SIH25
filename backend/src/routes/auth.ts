import { Router } from 'express';
import { z } from 'zod';
import { signToken } from '../services/jwt';
import { User } from '../types';
import { UserModel } from '../models/User';
import bcrypt from 'bcrypt';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', issues: parse.error.issues });
  const { email, password } = parse.data;
  const existing = await UserModel.findOne({ email });
  if (existing) return res.status(409).json({ error: 'User exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const created = await UserModel.create({ email, passwordHash });
  const user: User = { id: created.id, email: created.email, role: created.role };
  const token = signToken(user);
  res.status(201).json({ token, user });
});

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', issues: parse.error.issues });
  const { email, password } = parse.data;
  const userDoc = await UserModel.findOne({ email });
  if (!userDoc || !userDoc.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, userDoc.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const user: User = { id: userDoc.id, email: userDoc.email, role: userDoc.role };
  const token = signToken(user);
  res.json({ token, user });
});
