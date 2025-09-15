import { Router } from 'express';
import { z } from 'zod';
import { signToken } from '../services/jwt';
import { User } from '../types';
import { UserModel } from '../models/User';

export const authRouter = Router();

// For MVP we create or fetch a user record on login

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', issues: parse.error.issues });

  const { email } = parse.data;
  let userDoc = await UserModel.findOne({ email });
  if (!userDoc) {
    userDoc = await UserModel.create({ email });
  }
  const user: User = { id: userDoc.id, email: userDoc.email, role: userDoc.role };
  const token = signToken(user);
  res.json({ token, user });
});
