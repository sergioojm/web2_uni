import mongoose from 'mongoose';

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

const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: { type: String, required: true, trim: true },
    cif: { type: String, required: true, trim: true, uppercase: true },
    address: { type: addressSchema, default: () => ({}) },
    logo: { type: String, default: null },
    isFreelance: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

companySchema.index({ cif: 1 });
companySchema.index({ owner: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
