import express from 'express';
import Schedule from '../models/Schedule.js';
import Shift from '../models/Shift.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate, requireManager } from '../middleware/auth.js';

const router = express.Router();

// GET /api/schedules - list all schedules
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    // Employees only see published
    if (req.user.role === 'Employee') filter.status = 'Published';

    const schedules = await Schedule.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ weekStartDate: -1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/schedules/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate('createdBy', 'fullName');
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (req.user.role === 'Employee' && schedule.status !== 'Published') {
      return res.status(403).json({ message: 'Schedule not yet published' });
    }
    const shifts = await Shift.find({ scheduleId: schedule._id })
      .populate('assignedEmployeeId', 'fullName employeeId skill')
      .populate('swappedWith', 'fullName employeeId skill')
      .sort({ shiftDate: 1, startTime: 1 });

    res.json({ schedule, shifts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/schedules - create schedule (manager only)
router.post('/', authenticate, requireManager, async (req, res) => {
  try {
    const { weekStartDate, weekEndDate, notes } = req.body;
    const schedule = new Schedule({
      weekStartDate: new Date(weekStartDate),
      weekEndDate: new Date(weekEndDate),
      notes,
      createdBy: req.user._id,
    });
    await schedule.save();

    await AuditLog.create({
      action: 'ScheduleCreated',
      performedBy: req.user._id,
      targetId: schedule._id,
      targetModel: 'Schedule',
      details: { weekStartDate, weekEndDate },
    });

    res.status(201).json(schedule);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A schedule for this week already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/schedules/:id/publish - publish schedule (manager only)
router.patch('/:id/publish', authenticate, requireManager, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.status === 'Published') {
      return res.status(400).json({ message: 'Schedule already published' });
    }

    // Validate: at least 1 shift
    const shiftCount = await Shift.countDocuments({ scheduleId: schedule._id });
    if (shiftCount === 0) {
      return res.status(400).json({ message: 'Cannot publish a schedule with no shifts' });
    }

    await schedule.publish();

    await AuditLog.create({
      action: 'SchedulePublished',
      performedBy: req.user._id,
      targetId: schedule._id,
      targetModel: 'Schedule',
      details: { weekStartDate: schedule.weekStartDate },
    });

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/schedules/:id - delete draft schedule (manager only)
router.delete('/:id', authenticate, requireManager, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.status === 'Published') {
      return res.status(400).json({ message: 'Cannot delete a published schedule' });
    }
    await Shift.deleteMany({ scheduleId: schedule._id });
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
