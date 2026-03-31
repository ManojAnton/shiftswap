import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || user.status === 'Inactive') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireManager = (req, res, next) => {
  if (req.user?.role !== 'Manager') {
    return res.status(403).json({ message: 'Manager access required' });
  }
  next();
};

export const requireEmployee = (req, res, next) => {
  if (!['Manager', 'Employee'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};
