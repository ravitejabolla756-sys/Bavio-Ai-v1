require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { generalLimiter, apiLimiter } = require('./middleware/rateLimit');

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const app = express();
const PORT = process.env.PORT || 3000;

// ------- CORS Configuration -------
const allowedOrigins = [
  'https://bavio.in',
  'https://www.bavio.in',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'api-subscription-key']
};

// ------- Global Middleware -------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(session({
  secret: process.env.SESSION_SECRET || 'bavio_secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(generalLimiter);

// ------- Audio Static Route (MUST be before other routes) -------
app.use('/audio', express.static('/tmp/bavio-audio', {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

// ------- API Routes -------
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const assistantsRoutes = require('./routes/assistants');
const numbersRoutes = require('./routes/numbers');
const callsRoutes = require('./routes/calls');
const usageRoutes = require('./routes/usage');
const telephonyRoutes = require('./routes/telephony');
const leadsRoutes = require('./routes/leads');
const billingRoutes = require('./routes/billing');
const voiceRoutes = require('./routes/voice');
const googleAuthRoutes = require('./routes/googleAuth');
const twilioRoutes = require('./routes/twilioRoutes');
const onboardingRoutes = require('./routes/onboarding');

app.use('/auth', authRoutes);
app.use('/auth', googleAuthRoutes);
app.use('/calls/twilio', twilioRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/clients', clientsRoutes);
app.use('/assistants', apiLimiter, assistantsRoutes);
app.use('/numbers', apiLimiter, numbersRoutes);
app.use('/calls', apiLimiter, callsRoutes);
app.use('/usage', apiLimiter, usageRoutes);
app.use('/telephony', telephonyRoutes);
app.use('/leads', apiLimiter, leadsRoutes);
app.use('/billing', billingRoutes);
app.use('/voice', apiLimiter, voiceRoutes);

// ------- Health Check -------
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'Bavio AI Backend', version: '2.0.0' });
});

// ------- Database Connectivity Test -------
let db;
try {
  db = require('./database/db');
  console.log('Database module loaded successfully');
} catch (err) {
  console.error('Failed to load database module:', err.message);
  db = null;
}

app.get('/db-test', async (req, res) => {
  if (!db) {
    return res.status(503).json({ status: 'error', message: 'Database not available' });
  }
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({
      status: 'connected',
      database: 'Supabase PostgreSQL',
      server_time: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ------- Start Server -------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bavio AI Backend running on port ${PORT}`);
});

module.exports = app;
