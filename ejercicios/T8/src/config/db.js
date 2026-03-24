import mongoose from 'mongoose';

const dbConnect = async () => {
  const uri =
    process.env.NODE_ENV === 'test'
      ? process.env.MONGODB_TEST_URI
      : process.env.MONGODB_URI;

  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

export default dbConnect;
