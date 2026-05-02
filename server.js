require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(generalLimiter);

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

app.use('/auth', authRoutes);
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
const db = require('./database/db');
app.get('/db-test', async (req, res) => {
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
