import express from 'express';
import User from '../models/User.js';
import Availability from '../models/Availability.js';
import { authenticate, requireManager } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - all employees (manager only)
router.get('/', authenticate, requireManager, async (req, res) => {
  try {
    const { status, skill, search } = req.query;
    const filter = { role: 'Employee' };
    if (status && status !== 'All') filter.status = status;
    if (skill && skill !== 'All') filter.skill = skill;
    if (search) filter.fullName = { $regex: search, $options: 'i' };

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/employees - all active employees (for swap targeting)
router.get('/employees', authenticate, async (req, res) => {
  try {
    const users = await User.find({ role: 'Employee', status: 'Active' })
      .select('-passwordHash')
      .sort({ fullName: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users - create employee (manager only)
router.post('/', authenticate, requireManager, async (req, res) => {
  try {
    const { fullName, email, password, skill, employmentType, phone } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = new User({
      fullName,
      email,
      passwordHash: password,
      role: 'Employee',
      skill: skill || 'Cashier',
      employmentType: employmentType || 'Full-Time',
      phone,
    });

    await user.save();

    // Create default availability (all days available 9-5)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const availabilities = days.map(day => ({
      employeeId: user._id,
      dayOfWeek: day,
      isAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
      availableFrom: '09:00',
      availableTo: '17:00',
    }));
    await Availability.insertMany(availabilities);

    res.status(201).json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id - update employee (manager only)
router.put('/:id', authenticate, requireManager, async (req, res) => {
  try {
    const { fullName, email, skill, employmentType, phone, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (skill) user.skill = skill;
    if (employmentType) user.employmentType = employmentType;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;

    await user.save();
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id - deactivate employee (manager only)
router.delete('/:id', authenticate, requireManager, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = 'Inactive';
    await user.save();
    res.json({ message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
