import mongoose from 'mongoose';

export const config = {
  port: Number(process.env.PORT) || 3000,
  env: process.env.NODE_ENV || 'development',
  dbUri: process.env.DB_URI,
  jwt: {
    accessSecret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  uploadMaxSize: Number(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024
};

export const dbConnect = async () => {
  if (!config.dbUri) {
    console.error('❌ DB_URI no está definida en .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(config.dbUri);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};
