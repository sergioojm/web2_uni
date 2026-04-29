import mongoose from 'mongoose';
import { applySoftDeletePlugin } from '../utils/softDelete.js';

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    number: { type: String, trim: true },
    postal: { type: String, trim: true },
    city: { type: String, trim: true },
    province: { type: String, trim: true }
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    name: { type: String, required: true, trim: true },
    cif: { type: String, required: true, trim: true, uppercase: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: addressSchema, default: () => ({}) },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

clientSchema.index(
  { company: 1, cif: 1 },
  { unique: true, partialFilterExpression: { deleted: false } }
);
clientSchema.index({ company: 1, name: 1 });

applySoftDeletePlugin(clientSchema);

export default mongoose.model('Client', clientSchema);
