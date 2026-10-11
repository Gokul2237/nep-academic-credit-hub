const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// ============================================================
// LOAD ENVIRONMENT VARIABLES
// ============================================================

dotenv.config({
  path: path.join(__dirname, '.env'),
});

// ============================================================
// DATABASE
// ============================================================

const connectDB = require('./config/db');

// ============================================================
// ROUTES
// ============================================================

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const creditRoutes = require('./routes/creditRoutes');
const studentRoutes = require('./routes/studentRoutes');
const transferRoutes = require('./routes/transferRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const transcriptRoutes = require('./routes/transcriptRoutes');
const eligibilityRoutes = require('./routes/eligibilityRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const gatewayRoutes = require('./routes/gatewayRoutes');
const adminRoutes = require('./routes/adminRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
// ============================================================
// ADMIN BOOTSTRAP
// ============================================================

const {
  ensureAdminAccount,
} = require('./controllers/authController');

// ============================================================
// ERROR MIDDLEWARE
// ============================================================

const {
  notFoundHandler,
  errorHandler,
} = require('./middleware/errorMiddleware');

// ============================================================
// APP INITIALIZATION
// ============================================================

const app = express();
app.disable('etag');

const PORT = process.env.PORT || 5000;

// ============================================================
// SECURITY
// ============================================================

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      'http://localhost:5173',

    credentials: true,
  })
);

// ============================================================
// REQUEST PARSING
// ============================================================

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// ============================================================
// DEVELOPMENT REQUEST LOGGING
// ============================================================

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ============================================================
// AUTHENTICATION RATE LIMITER
// ============================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 100,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected';

  return res.status(200).json({
    success: true,

    message: 'NEP Credit Hub API is running',

    timestamp: new Date().toISOString(),

    database: dbStatus,
  });
});

// ============================================================
// API ROUTES
// ============================================================

/*
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 */

app.use(
  '/api/auth',
  authLimiter,
  authRoutes
);
app.use(
  '/api/transfers',
  transferRoutes
);
app.use('/api/certificates', certificateRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/v1/transcripts', transcriptRoutes);
 app.use(
  '/api/v1/transfers',
  transferRoutes
);
app.use(
  '/api/v1/auth',
  authLimiter,
  authRoutes
);

/*
 * ============================================================
 * COURSE CATALOG
 * ============================================================
 */

app.use(
  '/api/courses',
  courseRoutes
);

app.use(
  '/api/v1/courses',
  courseRoutes
);

/*
 * ============================================================
 * ACADEMIC CREDITS
 * ============================================================
 */

app.use(
  '/api/credits',
  creditRoutes
);

app.use(
  '/api/v1/credits',
  creditRoutes
);

/*
 * ============================================================
 * STUDENTS
 * ============================================================
 *
 * Institution users:
 *   Can see students belonging to their institution.
 *
 * Admin users:
 *   Can see all active students.
 *
 * Students:
 *   Are not allowed to access this endpoint.
 *
 * Main endpoint:
 *   GET /api/students
 *
 * Versioned endpoint:
 *   GET /api/v1/students
 *
 */

app.use('/api/students', studentRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/users/students', studentRoutes);
app.use('/api/v1/users/students', studentRoutes);

app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/v1/eligibility', eligibilityRoutes);

app.use('/api/recommendations', recommendationRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);

app.use('/api/gateway', gatewayRoutes);
app.use('/api/v1/gateway', gatewayRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/api/institution', institutionRoutes);
app.use('/api/v1/institution', institutionRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

/*
 * 404 - Route not found
 */
app.use(notFoundHandler);

/*
 * Global error handler
 */
app.use(errorHandler);

// ============================================================
// DATABASE CONNECTION
// ============================================================

connectDB()
  .then(async () => {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Database ready');

      /*
       * Create the initial admin only internally.
       *
       * There is NO public admin registration endpoint.
       */
      await ensureAdminAccount();
    }
  })
  .catch((error) => {
    console.error(
      '❌ Database initialization failed:',
      error.message
    );
  });

// ============================================================
// START SERVER
// ============================================================

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `🚀 NEP Academic Hub Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`
    );

    console.log(
      `📡 Health Check: http://localhost:${PORT}/api/health`
    );

    console.log(
      `🔐 Authentication API: http://localhost:${PORT}/api/auth`
    );

    console.log(
      `📚 Course Catalog API: http://localhost:${PORT}/api/courses`
    );

    console.log(
      `🎓 Academic Credits API: http://localhost:${PORT}/api/credits`
    );

    console.log(
      `👨‍🎓 Students API: http://localhost:${PORT}/api/students`
    );
  });
}

// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;