import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'node:path';

import userRoutes from './routes/user.routes.js';
import { notFound, errorHandler } from './middleware/error-handler.js';
import './services/notification.service.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  next();
});

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use('/api/user', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
