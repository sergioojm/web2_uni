import http from 'node:http';
import mongoose from 'mongoose';
import app from './app.js';
import { config, dbConnect } from './config/index.js';
import { initSocket, closeSocket } from './services/socket.service.js';

const httpServer = http.createServer(app);

const start = async () => {
  try {
    await dbConnect();
    initSocket(httpServer);
    httpServer.listen(config.port, () => {
      console.log(`BildyApp API en http://localhost:${config.port}`);
      console.log(`Swagger en http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`\n${signal} recibido, cerrando…`);
  try {
    await new Promise((resolve) => httpServer.close(() => resolve()));
    await closeSocket();
    await mongoose.connection.close();
    console.log('Cierre limpio');
    process.exit(0);
  } catch (err) {
    console.error('Error en shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
