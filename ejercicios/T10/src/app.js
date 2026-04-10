import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from 'cors';
import routes from './routes/index.js';
import { initSocket } from './socket/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
export const httpServer = createServer(app);

// Inicializar Socket.IO
initSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (public/)
// En caso de tener .html
// app.use(express.static(join(__dirname, '..', 'public'))); 

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas API
app.use('/api', routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
