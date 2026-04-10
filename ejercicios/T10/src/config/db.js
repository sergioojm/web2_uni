import mongoose from 'mongoose';
import dns from 'node:dns/promises';

// Forzar DNS en WSL (misma workaround que MODELO_VC_MONGO)
dns.setServers(['1.1.1.1', '8.8.8.8']);

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Desconectado de MongoDB');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

export default dbConnect;
