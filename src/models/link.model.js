import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

linkSchema.index({ user: 1, createdAt: -1 });
linkSchema.index({ user: 1, totalClicks: -1 });
linkSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Link', linkSchema);
