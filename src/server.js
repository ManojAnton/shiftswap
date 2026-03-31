import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import scheduleRoutes from './routes/schedules.js';
import shiftRoutes from './routes/shifts.js';
import swapRoutes from './routes/swaps.js';
import availabilityRoutes from './routes/availability.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/dashboard', dashboardRoutes);

// In production: serve the built React app from /dist
if (isProd) {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  // All non-API routes return index.html (React Router handles them)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      if (isProd) {
        console.log(`🌐 App available at http://localhost:${PORT}`);
      } else {
        console.log(`📡 API at http://localhost:${PORT}/api`);
        console.log(`💻 Frontend dev server at http://localhost:5173`);
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

export default app;
