import express from 'express';
import Availability from '../models/Availability.js';
import Shift from '../models/Shift.js';
import User from '../models/User.js';
import { authenticate, requireManager } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.query;
    let filter = {};
    if (req.user.role === 'Employee') filter.employeeId = req.user._id;
    else if (employeeId) filter.employeeId = employeeId;
    const availability = await Availability.find(filter)
      .populate('employeeId', 'fullName employeeId skill')
      .sort({ dayOfWeek: 1 });
    res.json(availability);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/all-employees', authenticate, requireManager, async (req, res) => {
  try {
    const employees = await User.find({ role: 'Employee', status: 'Active' }).select('-passwordHash');
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const result = await Promise.all(employees.map(async (emp) => {
      const avail = await Availability.find({ employeeId: emp._id });
      const availMap = {};
      days.forEach(day => {
        const found = avail.find(a => a.dayOfWeek === day);
        availMap[day] = found || { dayOfWeek: day, isAvailable: false, availableFrom: null, availableTo: null };
      });
      return { employee: emp, availability: availMap };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Smart available-for-shift:
// Returns two groups:
//   canExchange: employees who HAVE a shift that day (different time) → true swap
//   canCover:    employees who are FREE that day → cover
router.get('/available-for-shift', authenticate, async (req, res) => {
  try {
    const { day, startTime, endTime, shiftDate, excludeShiftId } = req.query;
    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: 'day, startTime, endTime are required' });
    }

    // All active employees except the requester
    const allEmployees = await User.find({
      role: 'Employee',
      status: 'Active',
      _id: { $ne: req.user._id },
    }).select('-passwordHash').lean();

    // Check availability for each employee
    const availableEmployees = [];
    for (const emp of allEmployees) {
      const avail = await Availability.findOne({
        employeeId: emp._id,
        dayOfWeek: day,
        isAvailable: true,
        availableFrom: { $lte: startTime },
        availableTo: { $gte: endTime },
      });
      if (avail) availableEmployees.push(emp);
    }

    if (!shiftDate || availableEmployees.length === 0) {
      return res.json({ canExchange: [], canCover: availableEmployees });
    }

    // Find all shifts on that date for available employees
    const dateStart = new Date(shiftDate);
    dateStart.setUTCHours(0, 0, 0, 0);
    const dateEnd = new Date(shiftDate);
    dateEnd.setUTCHours(23, 59, 59, 999);

    const shiftsOnDate = await Shift.find({
      shiftDate: { $gte: dateStart, $lte: dateEnd },
      assignedEmployeeId: { $in: availableEmployees.map(e => e._id) },
      ...(excludeShiftId ? { _id: { $ne: excludeShiftId } } : {}),
    }).lean();

    // Map employeeId → their shift that day
    const shiftByEmployee = {};
    shiftsOnDate.forEach(s => {
      shiftByEmployee[String(s.assignedEmployeeId)] = s;
    });

    const canExchange = []; // Has a shift that day — true exchange
    const canCover = [];    // No shift that day — just covering

    for (const emp of availableEmployees) {
      const theirShift = shiftByEmployee[String(emp._id)];
      if (theirShift) {
        // Check their shift doesn't overlap exactly (same time = already there)
        const sameTime = theirShift.startTime === startTime && theirShift.endTime === endTime;
        if (!sameTime) {
          canExchange.push({ ...emp, theirShift });
        }
      } else {
        canCover.push(emp);
      }
    }

    res.json({ canExchange, canCover });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:day', authenticate, async (req, res) => {
  try {
    const { isAvailable, availableFrom, availableTo } = req.body;
    const employeeId = req.user.role === 'Manager' && req.body.employeeId ? req.body.employeeId : req.user._id;
    const avail = await Availability.findOneAndUpdate(
      { employeeId, dayOfWeek: req.params.day },
      { isAvailable, availableFrom, availableTo },
      { upsert: true, new: true }
    ).populate('employeeId', 'fullName');
    res.json(avail);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { availability } = req.body;
    const employeeId = req.user._id;
    const ops = availability.map(item => ({
      updateOne: {
        filter: { employeeId, dayOfWeek: item.dayOfWeek },
        update: { $set: { ...item, employeeId } },
        upsert: true,
      },
    }));
    await Availability.bulkWrite(ops);
    const updated = await Availability.find({ employeeId }).sort({ dayOfWeek: 1 });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
