import { Router } from 'express';
import { z } from 'zod';
import { signToken } from '../services/jwt';
import { User } from '../types';

export const authRouter = Router();

// Temporary in-memory user for MVP
const mockUser: User = { id: 'u1', email: 'demo@tourist.app', role: 'tourist' };

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

authRouter.post('/login', (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', issues: parse.error.issues });

  const { email } = parse.data;
  // For MVP any email/password returns mock user with that email
  const user: User = { ...mockUser, email };
  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});
