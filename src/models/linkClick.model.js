import mongoose from 'mongoose';

const linkClickSchema = new mongoose.Schema(
  {
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    clickedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    referer: {
      type: String,
    },
    browser: {
      type: String,
    },
    deviceType: {
      type: String,
    },
  },
  { timestamps: false },
);

// Para consultas por link y rango de fechas
linkClickSchema.index({ link: 1, clickedAt: -1 });

// Para consultas por usuario y rango de fechas
linkClickSchema.index({ user: 1, clickedAt: -1 });

// Para agregaciones por fecha globales
linkClickSchema.index({ clickedAt: -1 });

export default mongoose.model('LinkClick', linkClickSchema);
