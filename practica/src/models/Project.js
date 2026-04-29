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

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    name: { type: String, required: true, trim: true },
    projectCode: { type: String, required: true, trim: true },
    address: { type: addressSchema, default: () => ({}) },
    email: { type: String, trim: true, lowercase: true },
    notes: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

projectSchema.index(
  { company: 1, projectCode: 1 },
  { unique: true, partialFilterExpression: { deleted: false } }
);
projectSchema.index({ company: 1, client: 1 });

applySoftDeletePlugin(projectSchema);

export default mongoose.model('Project', projectSchema);
