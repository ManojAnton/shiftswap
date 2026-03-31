import express from 'express';
import Shift from '../models/Shift.js';
import Schedule from '../models/Schedule.js';
import { authenticate, requireManager } from '../middleware/auth.js';

const router = express.Router();

const populateShift = (query) =>
  query
    .populate('scheduleId', 'weekStartDate weekEndDate status')
    .populate('assignedEmployeeId', 'fullName employeeId skill')
    .populate('swappedWith', 'fullName employeeId skill');

// GET /api/shifts/my
router.get('/my', authenticate, async (req, res) => {
  try {
    const shifts = await populateShift(
      Shift.find({ assignedEmployeeId: req.user._id }).sort({ shiftDate: 1, startTime: 1 })
    );
    const filtered = req.user.role === 'Employee'
      ? shifts.filter(s => s.scheduleId?.status === 'Published')
      : shifts;
    res.json(filtered);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/shifts
router.get('/', authenticate, async (req, res) => {
  try {
    const { scheduleId, employeeId } = req.query;
    const filter = {};
    if (scheduleId) filter.scheduleId = scheduleId;
    if (employeeId) filter.assignedEmployeeId = employeeId;
    if (req.user.role === 'Employee' && !employeeId) {
      filter.assignedEmployeeId = req.user._id;
    }
    const shifts = await populateShift(
      Shift.find(filter).sort({ shiftDate: 1, startTime: 1 })
    );
    res.json(shifts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/shifts
router.post('/', authenticate, requireManager, async (req, res) => {
  try {
    const { scheduleId, shiftDate, startTime, endTime, requiredSkill, assignedEmployeeId, location, notes } = req.body;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    const shift = new Shift({
      scheduleId, shiftDate: new Date(shiftDate),
      startTime, endTime, requiredSkill,
      assignedEmployeeId: assignedEmployeeId || null,
      location, notes,
    });
    await shift.save();
    const populated = await populateShift(Shift.findById(shift._id));
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/shifts/:id
router.put('/:id', authenticate, requireManager, async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    const populated = await populateShift(Shift.findById(shift._id));
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/shifts/:id
router.delete('/:id', authenticate, requireManager, async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    res.json({ message: 'Shift deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
