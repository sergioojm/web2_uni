import app from './app.js';
import { config, dbConnect } from './config/index.js';

const start = async () => {
  try {
    await dbConnect();
    app.listen(config.port, () => {
      console.log(`🚀 BildyApp API en http://localhost:${config.port}`);
      console.log(`📚 API base: http://localhost:${config.port}/api/user`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
    process.exit(1);
  }
};

start();
