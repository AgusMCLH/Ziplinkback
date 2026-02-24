import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    lastClickedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

linkSchema.index({ user: 1, createdAt: -1 });
linkSchema.index({ user: 1, totalClicks: -1 });

export default mongoose.model('Link', linkSchema);
