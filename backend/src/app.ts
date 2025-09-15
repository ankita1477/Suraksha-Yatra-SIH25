import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { createPanicRouter } from './routes/panic';
import { Server } from 'socket.io';
import http from 'http';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);

  // We'll inject panic route later when socket is ready
  return app;
}

export function attachRealtime(app: express.Express) {
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*'} });

  // Panic route needs io
  app.use('/api/panic', createPanicRouter(io));

  io.on('connection', socket => {
    // Basic connection log
    socket.emit('welcome', { message: 'Connected to Suraksha Realtime' });
  });

  return { server, io };
}
