import mongoose from 'mongoose';
import dbConnect from '../src/config/db.js';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await dbConnect();
  }
}, 30000);
