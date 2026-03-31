import mongoose from 'mongoose';

const swapRequestSchema = new mongoose.Schema({
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  requestedByEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, default: '' },

  // Step 1: Target employee responds
  employeeStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
  employeeDecidedAt: { type: Date },
  employeeRejectionReason: { type: String },

  // Step 2: Manager final decision (only if employeeStatus = Accepted)
  managerStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  decidedByManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managerDecidedAt: { type: Date },
  managerRejectionReason: { type: String },

  // Overall status derived field
  overallStatus: {
    type: String,
    enum: ['AwaitingEmployee', 'AwaitingManager', 'Approved', 'RejectedByEmployee', 'RejectedByManager', 'Cancelled'],
    default: 'AwaitingEmployee',
  },
}, { timestamps: true });

// Auto-update overallStatus
swapRequestSchema.pre('save', function (next) {
  // Don't overwrite Cancelled status
  if (this.overallStatus === 'Cancelled') return next();

  if (this.employeeStatus === 'Rejected') {
    this.overallStatus = 'RejectedByEmployee';
  } else if (this.employeeStatus === 'Accepted' && this.managerStatus === 'Pending') {
    this.overallStatus = 'AwaitingManager';
  } else if (this.managerStatus === 'Approved') {
    this.overallStatus = 'Approved';
  } else if (this.managerStatus === 'Rejected') {
    this.overallStatus = 'RejectedByManager';
  } else if (this.employeeStatus === 'Pending') {
    this.overallStatus = 'AwaitingEmployee';
  }
  next();
});

export default mongoose.model('SwapRequest', swapRequestSchema);
