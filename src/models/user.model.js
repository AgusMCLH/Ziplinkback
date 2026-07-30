import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      default: 'User Name',
    },
    plan: {
      type: String,
      enum: ['standard', 'premium'],
      default: 'standard',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
