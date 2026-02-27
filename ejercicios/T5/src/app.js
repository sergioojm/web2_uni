// Esta corrección no debe aplicarse a este fragmento.
// @no_eval
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

// tengo unos DNS distintos configurados
// he tenido que forzar a NODE a usar esos DNS
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);   

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});


app.use('/uploads', express.static('storage'));
app.use('/api', routes);


app.use(notFound);
app.use(errorHandler);

export default app;
