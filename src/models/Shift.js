import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  scheduleId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  shiftDate:          { type: Date, required: true },
  startTime:          { type: String, required: true },
  endTime:            { type: String, required: true },
  requiredSkill: {
    type: String,
    enum: ['Cashier', 'Floor Staff', 'Stock Room', 'Supervisor', 'Customer Service'],
    required: true,
  },
  assignedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  location:           { type: String, default: 'Main Store' },
  notes:              { type: String },
  // Swap tracking
  swappedWith:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  swappedAt:          { type: Date, default: null },
  swapRequestId:      { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', default: null },
}, { timestamps: true });

export default mongoose.model('Shift', shiftSchema);
