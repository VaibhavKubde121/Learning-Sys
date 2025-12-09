// server.js
const express = require("express");
// Touch: update timestamp to force nodemon restart when routes/controllers change
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const morgan = require('morgan');

// Load env vars from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
connectDB();

// Initialize express
const app = express();



// Middleware
app.use(express.json());

// CORS configuration - allow frontend origin(s) and handle credentials
// Read FRONTEND_URL (single URL) or FRONTEND_URLS (comma-separated) from env.
const frontendFromEnv = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
const frontendList = frontendFromEnv
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const frontendDefault = frontendList.length ? frontendList[0] : 'http://localhost:5173';
const allowedOrigins = [
  ...frontendList,
  frontendDefault,
  'http://localhost:5173',
  'http://localhost:5174',
];

const allowAll = String(process.env.ALLOW_ALL_ORIGINS || '').toLowerCase() === 'true';

if (allowAll) {
  console.warn('⚠️  CORS is currently configured to allow all origins (ALLOW_ALL_ORIGINS=true).');
}

console.log('➡️  CORS allowed origins:', allowedOrigins);
console.log('➡️  FRONTEND_URL(s) from env:', frontendFromEnv || '<none>');
console.log('➡️  ALLOW_ALL_ORIGINS:', allowAll);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like curl or server-to-server)
    if (!origin) return callback(null, true);

    // If allowAll is enabled, accept any origin (useful for quick testing only)
    if (allowAll) return callback(null, true);

    // Accept exact matches from allowedOrigins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Not allowed — include the origin in the error message for diagnostics
    const err = new Error(`Not allowed by CORS — origin: ${origin}`);
    console.warn('⛔ CORS blocked request from origin:', origin);
    return callback(err);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
// Handle preflight requests by invoking CORS middleware for OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return cors(corsOptions)(req, res, next);
  }
  next();
});

app.use(morgan('dev')); // HTTP request logger

// Routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const aiTutorRoutes = require('./routes/aiTutorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const featureFlagRoutes = require('./routes/featureFlagRoutes');
const progressRoutes = require('./routes/progressRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const studentRoutesFile = require('./routes/studentRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const parentRoutes = require('./routes/parentRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiTutorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/flags', featureFlagRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/student', studentRoutesFile);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/parents', parentRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.send("KavyaLearn API is running...");
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
👉 API Documentation: http://localhost:${PORT}/api-docs
📝 MongoDB URI: ${process.env.MONGO_URI}
  `);
});
