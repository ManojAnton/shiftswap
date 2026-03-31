import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  isAvailable: { type: Boolean, default: true },
  availableFrom: { type: String, default: '09:00' }, // "09:00"
  availableTo: { type: String, default: '17:00' },   // "17:00"
}, { timestamps: true });

// One record per employee per day
availabilitySchema.index({ employeeId: 1, dayOfWeek: 1 }, { unique: true });

export default mongoose.model('Availability', availabilitySchema);
