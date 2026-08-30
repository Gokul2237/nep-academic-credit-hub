const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const creditRoutes = require('./routes/creditRoutes');
const { ensureAdminAccount } = require('./controllers/authController');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database and bootstrap Admin
connectDB().then(() => {
  if (mongoose.connection.readyState === 1) {
    ensureAdminAccount();
  }
});

// Security & Request Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate Limiter for Authentication Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// Health Check Route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return res.status(200).json({
    success: true,
    message: 'NEP Credit Hub API is running',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);

app.use('/api/courses', courseRoutes);
app.use('/api/v1/courses', courseRoutes);

app.use('/api/credits', creditRoutes);
app.use('/api/v1/credits', creditRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 NEP Academic Hub Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`📡 Health Check endpoint: http://localhost:${PORT}/api/health`);
    console.log(`📚 Course Catalog API: http://localhost:${PORT}/api/courses`);
    console.log(`🎓 Academic Credits API: http://localhost:${PORT}/api/credits`);
  });
}

module.exports = app;
