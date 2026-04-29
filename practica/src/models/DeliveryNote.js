import mongoose from 'mongoose';
import { applySoftDeletePlugin } from '../utils/softDelete.js';

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hours: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
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
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    format: { type: String, enum: ['material', 'hours'], required: true },
    description: { type: String, trim: true, default: '' },
    workDate: { type: Date, default: Date.now },
    material: { type: String, trim: true },
    quantity: { type: Number, min: 0 },
    unit: { type: String, trim: true },
    hours: { type: Number, min: 0 },
    workers: { type: [workerSchema], default: [] },
    signed: { type: Boolean, default: false },
    signedAt: { type: Date, default: null },
    signatureUrl: { type: String, default: null },
    pdfUrl: { type: String, default: null },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

deliveryNoteSchema.pre('validate', function (next) {
  if (this.format === 'material') {
    if (!this.material || this.quantity == null) {
      return next(
        new Error('Albarán de material requiere "material" y "quantity"')
      );
    }
  } else if (this.format === 'hours') {
    const hasHours = this.hours != null && this.hours >= 0;
    const hasWorkers = Array.isArray(this.workers) && this.workers.length > 0;
    if (!hasHours && !hasWorkers) {
      return next(
        new Error('Albarán de horas requiere "hours" o al menos un "worker"')
      );
    }
  }
  next();
});

deliveryNoteSchema.index({ company: 1, project: 1 });
deliveryNoteSchema.index({ company: 1, client: 1 });
deliveryNoteSchema.index({ company: 1, signed: 1 });
deliveryNoteSchema.index({ company: 1, workDate: -1 });

applySoftDeletePlugin(deliveryNoteSchema);

export default mongoose.model('DeliveryNote', deliveryNoteSchema);
