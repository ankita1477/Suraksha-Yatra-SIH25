import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { createPanicRouter, createPanicQueryRouter } from './routes/panic';
import { locationRouter } from './routes/location';
import { incidentsRouter } from './routes/incidents';
import { emergencyContactsRouter } from './routes/emergencyContacts';
import { userRouter } from './routes/user';
import { Server } from 'socket.io';
import http from 'http';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/emergency-contacts', emergencyContactsRouter);

  app.use('/api/location', locationRouter);
  app.use('/api/incidents', incidentsRouter);
  // We'll inject panic route later when socket is ready
  return app;
}

export function attachRealtime(app: express.Express) {
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*'} });

  // Panic route needs io
  app.use('/api/panic', createPanicRouter(io));
  
  // Panic alerts query routes
  app.use('/api/panic-alerts', createPanicQueryRouter());

  io.on('connection', socket => {
    // Basic connection log
    socket.emit('welcome', { message: 'Connected to Suraksha Realtime' });
  });

  return { server, io };
}
