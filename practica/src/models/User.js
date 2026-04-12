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

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    name: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    nif: { type: String, trim: true, uppercase: true, default: '' },
    role: {
      type: String,
      enum: ['admin', 'guest'],
      default: 'admin'
    },
    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending'
    },
    verificationCode: { type: String, select: false },
    verificationAttempts: { type: Number, default: 3 },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    address: { type: addressSchema, default: () => ({}) },
    refreshToken: { type: String, select: false, default: null },
    deleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.verificationCode;
        delete ret.refreshToken;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.name || ''} ${this.lastName || ''}`.trim();
});

// email ya tiene unique:true en la definición del campo
userSchema.index({ company: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
