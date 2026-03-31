import express from 'express';
import SwapRequest from '../models/SwapRequest.js';
import Shift from '../models/Shift.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate, requireManager } from '../middleware/auth.js';

const router = express.Router();

// Populate swap with all related data - returns plain JSON
const populateSwap = (query) =>
  query
    .populate('shiftId')
    .populate('requestedByEmployeeId', 'fullName employeeId skill')
    .populate('targetEmployeeId', 'fullName employeeId skill')
    .populate('decidedByManagerId', 'fullName')
    .lean(); // lean() returns plain JS objects, not Mongoose documents

// Attach target employee's shift on the same date
async function withTargetShift(swaps) {
  const isArray = Array.isArray(swaps);
  const docs = isArray ? swaps : [swaps];

  const results = await Promise.all(docs.map(async (swap) => {
    // swap is already a plain object from lean()
    try {
      const shift = swap.shiftId;
      const target = swap.targetEmployeeId;
      if (shift && target) {
        const targetId = target._id || target;
        const shiftDate = new Date(shift.shiftDate);
        const dateStart = new Date(shiftDate);
        dateStart.setUTCHours(0, 0, 0, 0);
        const dateEnd = new Date(shiftDate);
        dateEnd.setUTCHours(23, 59, 59, 999);

        const targetShift = await Shift.findOne({
          assignedEmployeeId: targetId,
          shiftDate: { $gte: dateStart, $lte: dateEnd },
          _id: { $ne: shift._id },
        }).lean();

        swap.targetEmployeeShift = targetShift || null;
      }
    } catch {
      swap.targetEmployeeShift = null;
    }
    return swap;
  }));

  return isArray ? results : results[0];
}

// GET /api/swaps
router.get('/', authenticate, async (req, res) => {
  try {
    const { overallStatus } = req.query;
    const filter = {};
    if (req.user.role === 'Employee') {
      filter.$or = [
        { requestedByEmployeeId: req.user._id },
        { targetEmployeeId: req.user._id },
      ];
    }
    if (overallStatus && overallStatus !== 'All') filter.overallStatus = overallStatus;

    const docs = await populateSwap(SwapRequest.find(filter).sort({ createdAt: -1 }));
    const result = await withTargetShift(docs);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/swaps/sent
router.get('/sent', authenticate, async (req, res) => {
  try {
    const docs = await populateSwap(
      SwapRequest.find({ requestedByEmployeeId: req.user._id }).sort({ createdAt: -1 })
    );
    res.json(await withTargetShift(docs));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/swaps/incoming
router.get('/incoming', authenticate, async (req, res) => {
  try {
    const docs = await populateSwap(
      SwapRequest.find({ targetEmployeeId: req.user._id, employeeStatus: 'Pending' }).sort({ createdAt: -1 })
    );
    res.json(await withTargetShift(docs));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/swaps/pending-manager
router.get('/pending-manager', authenticate, requireManager, async (req, res) => {
  try {
    const docs = await populateSwap(
      SwapRequest.find({ overallStatus: 'AwaitingManager' }).sort({ createdAt: -1 })
    );
    res.json(await withTargetShift(docs));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/swaps/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doc = await populateSwap(SwapRequest.findById(req.params.id));
    if (!doc) return res.status(404).json({ message: 'Swap request not found' });
    res.json(await withTargetShift(doc));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/swaps - employee creates swap request
router.post('/', authenticate, async (req, res) => {
  try {
    const { shiftId, targetEmployeeId, reason } = req.body;
    if (req.user.role !== 'Employee') {
      return res.status(403).json({ message: 'Only employees can request swaps' });
    }
    const shift = await Shift.findById(shiftId);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    if (String(shift.assignedEmployeeId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only swap your own shifts' });
    }
    const existing = await SwapRequest.findOne({
      shiftId,
      overallStatus: { $in: ['AwaitingEmployee', 'AwaitingManager'] },
    });
    if (existing) {
      return res.status(409).json({ message: 'A pending swap already exists for this shift' });
    }

    const swap = new SwapRequest({ shiftId, requestedByEmployeeId: req.user._id, targetEmployeeId, reason });
    await swap.save();

    await AuditLog.create({
      action: 'SwapRequested', performedBy: req.user._id,
      targetId: swap._id, targetModel: 'SwapRequest',
      details: { shiftId, targetEmployeeId, reason },
    });

    const doc = await populateSwap(SwapRequest.findById(swap._id));
    res.status(201).json(await withTargetShift(doc));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/swaps/:id/employee-respond
router.patch('/:id/employee-respond', authenticate, async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (String(swap.targetEmployeeId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (swap.employeeStatus !== 'Pending') {
      return res.status(400).json({ message: 'Already responded' });
    }

    if (action === 'accept') {
      swap.employeeStatus = 'Accepted';
      swap.employeeDecidedAt = new Date();
    } else if (action === 'reject') {
      swap.employeeStatus = 'Rejected';
      swap.employeeDecidedAt = new Date();
      swap.employeeRejectionReason = rejectionReason;
    } else {
      return res.status(400).json({ message: 'action must be accept or reject' });
    }
    await swap.save();

    await AuditLog.create({
      action: action === 'accept' ? 'SwapAcceptedByEmployee' : 'SwapRejectedByEmployee',
      performedBy: req.user._id, targetId: swap._id, targetModel: 'SwapRequest',
    });

    const doc = await populateSwap(SwapRequest.findById(swap._id));
    res.json(await withTargetShift(doc));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/swaps/:id/manager-decide
router.patch('/:id/manager-decide', authenticate, requireManager, async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (swap.overallStatus !== 'AwaitingManager') {
      return res.status(400).json({ message: 'Not awaiting manager decision' });
    }

    if (action === 'approve') {
      swap.managerStatus = 'Approved';
      swap.managerDecidedAt = new Date();
      swap.decidedByManagerId = req.user._id;

      // Get requester's shift
      const requesterShift = await Shift.findById(swap.shiftId);
      if (!requesterShift) {
        return res.status(404).json({ message: 'Shift not found' });
      }

      const originalRequesterId = requesterShift.assignedEmployeeId;
      const targetId = swap.targetEmployeeId;
      const now = new Date();

      // Find if target also has a shift on that day (true exchange)
      const shiftDate = new Date(requesterShift.shiftDate);
      const dateStart = new Date(shiftDate); dateStart.setUTCHours(0,0,0,0);
      const dateEnd   = new Date(shiftDate); dateEnd.setUTCHours(23,59,59,999);

      const targetShift = await Shift.findOne({
        assignedEmployeeId: targetId,
        shiftDate: { $gte: dateStart, $lte: dateEnd },
        _id: { $ne: requesterShift._id },
      });

      if (targetShift) {
        // ── TRUE EXCHANGE ── both shifts swap owners
        // Requester's shift → goes to target employee
        requesterShift.assignedEmployeeId = targetId;
        requesterShift.swappedWith = originalRequesterId;
        requesterShift.swappedAt = now;
        requesterShift.swapRequestId = swap._id;
        requesterShift.notes = `Swapped with ${originalRequesterId}`;
        await requesterShift.save();

        // Target's shift → goes to requester employee
        targetShift.assignedEmployeeId = originalRequesterId;
        targetShift.swappedWith = targetId;
        targetShift.swappedAt = now;
        targetShift.swapRequestId = swap._id;
        targetShift.notes = `Swapped with ${targetId}`;
        await targetShift.save();
      } else {
        // ── COVER ── target covers requester's shift
        requesterShift.assignedEmployeeId = targetId;
        requesterShift.swappedWith = originalRequesterId;
        requesterShift.swappedAt = now;
        requesterShift.swapRequestId = swap._id;
        requesterShift.notes = `Covered by ${targetId}`;
        await requesterShift.save();
      }
    } else if (action === 'reject') {
      swap.managerStatus = 'Rejected';
      swap.managerDecidedAt = new Date();
      swap.decidedByManagerId = req.user._id;
      swap.managerRejectionReason = rejectionReason;
    } else {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }
    await swap.save();

    await AuditLog.create({
      action: action === 'approve' ? 'SwapApprovedByManager' : 'SwapRejectedByManager',
      performedBy: req.user._id, targetId: swap._id, targetModel: 'SwapRequest',
      details: { rejectionReason },
    });

    const doc = await populateSwap(SwapRequest.findById(swap._id));
    res.json(await withTargetShift(doc));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/swaps/:id/cancel
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (String(swap.requestedByEmployeeId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only requester can cancel' });
    }
    if (swap.overallStatus !== 'AwaitingEmployee') {
      return res.status(400).json({ message: 'Cannot cancel — already decided' });
    }
    swap.overallStatus = 'Cancelled';
    swap.employeeStatus = 'Rejected';
    await swap.save();
    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
