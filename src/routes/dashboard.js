import express from 'express';
import Schedule from '../models/Schedule.js';
import Shift from '../models/Shift.js';
import SwapRequest from '../models/SwapRequest.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/manager
router.get('/manager', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [
      totalEmployees,
      activeEmployees,
      totalShiftsThisWeek,
      pendingSwaps,
      awaitingManagerSwaps,
      approvedSwaps,
      rejectedSwaps,
      recentAuditLogs,
      publishedSchedules,
    ] = await Promise.all([
      User.countDocuments({ role: 'Employee' }),
      User.countDocuments({ role: 'Employee', status: 'Active' }),
      Shift.countDocuments({ shiftDate: { $gte: weekStart, $lte: weekEnd } }),
      SwapRequest.countDocuments({ overallStatus: 'AwaitingEmployee' }),
      SwapRequest.countDocuments({ overallStatus: 'AwaitingManager' }),
      SwapRequest.countDocuments({ overallStatus: 'Approved' }),
      SwapRequest.countDocuments({ overallStatus: { $in: ['RejectedByEmployee', 'RejectedByManager'] } }),
      AuditLog.find()
        .populate('performedBy', 'fullName')
        .sort({ timestamp: -1 })
        .limit(10),
      Schedule.countDocuments({ status: 'Published' }),
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      totalShiftsThisWeek,
      pendingSwaps: pendingSwaps + awaitingManagerSwaps,
      awaitingManagerSwaps,
      approvedSwaps,
      rejectedSwaps,
      publishedSchedules,
      recentActivity: recentAuditLogs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/employee
router.get('/employee', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const myShifts = await Shift.find({
      assignedEmployeeId: req.user._id,
      shiftDate: { $gte: weekStart, $lte: weekEnd },
    }).populate('scheduleId', 'status');

    const publishedShifts = myShifts.filter(s => s.scheduleId?.status === 'Published');

    // Calculate total hours
    let totalMinutes = 0;
    publishedShifts.forEach(shift => {
      const [sh, sm] = shift.startTime.split(':').map(Number);
      const [eh, em] = shift.endTime.split(':').map(Number);
      totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
    });

    const [pendingSwaps, incomingSwaps, approvedSwaps] = await Promise.all([
      SwapRequest.countDocuments({
        requestedByEmployeeId: req.user._id,
        overallStatus: { $in: ['AwaitingEmployee', 'AwaitingManager'] },
      }),
      SwapRequest.countDocuments({
        targetEmployeeId: req.user._id,
        employeeStatus: 'Pending',
      }),
      SwapRequest.countDocuments({
        $or: [
          { requestedByEmployeeId: req.user._id },
          { targetEmployeeId: req.user._id },
        ],
        overallStatus: 'Approved',
      }),
    ]);

    res.json({
      totalHoursThisWeek: Math.round(totalMinutes / 60 * 10) / 10,
      shiftsThisWeek: publishedShifts.length,
      pendingSwaps,
      incomingSwaps,
      approvedSwaps,
      daysOff: 7 - publishedShifts.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
