import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import swaggerSpecs from './docs/swagger.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

// tengo unos DNS distintos configurados
// he tenido que forzar a NODE a usar esos DNS
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);


export default app;
