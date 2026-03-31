import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Manager', 'Employee'], required: true },
  employeeId: { type: String, unique: true, sparse: true },
  phone: { type: String, trim: true },
  skill: { type: String, enum: ['Cashier', 'Floor Staff', 'Stock Room', 'Supervisor', 'Customer Service'], default: 'Cashier' },
  employmentType: { type: String, enum: ['Full-Time', 'Part-Time'], default: 'Full-Time' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Auto-generate employeeId for employees
userSchema.pre('save', async function (next) {
  if (this.role === 'Employee' && !this.employeeId) {
    const count = await mongoose.model('User').countDocuments({ role: 'Employee' });
    this.employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('User', userSchema);
