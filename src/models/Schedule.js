import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  weekStartDate: { type: Date, required: true },
  weekEndDate: { type: Date, required: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publishedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

// Ensure only one schedule per week
scheduleSchema.index({ weekStartDate: 1 }, { unique: true });

scheduleSchema.methods.publish = async function () {
  this.status = 'Published';
  this.publishedAt = new Date();
  return this.save();
};

export default mongoose.model('Schedule', scheduleSchema);
