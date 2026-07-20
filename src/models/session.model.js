import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
