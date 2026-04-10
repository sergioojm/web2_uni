import { httpServer } from './app.js';
import dbConnect from './config/db.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await dbConnect();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    console.log(`💬 Chat en http://localhost:${PORT}/chat.html`);
  });
};

startServer();
