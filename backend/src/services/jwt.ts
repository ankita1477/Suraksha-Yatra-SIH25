import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User } from '../types';

export function signToken(user: User) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, ENV.JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, ENV.JWT_SECRET) as { sub: string; email: string; role: string; iat: number; exp: number };
}
