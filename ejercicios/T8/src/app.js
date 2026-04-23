import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import swaggerSpecs from './docs/swagger.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';

// tengo unos DNS distintos configurados
// he tenido que forzar a NODE a usar esos DNS
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api', routes);

app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  };

  try {
    await mongoose.connection.db.admin().ping();
    health.database = 'connected';
  } catch {
    health.status = 'error';
    health.database = 'disconnected';
    return res.status(503).json(health);
  }

  res.json(health);
});

app.use(notFound);
app.use(errorHandler);


export default app;
