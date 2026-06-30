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
  'http://localhost:3001',
  'http://localhost:5000',
  'https://bavio.vercel.app',
  'https://alaya-osteopathic-suppliantly.ngrok-free.dev'
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
app.set('trust proxy', 1); // Trust first proxy (ngrok / load balancer)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(generalLimiter);

// Serve static audio files locally for ultra-low latency playback
app.use('/audio', express.static('/tmp/bavio-audio'));

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
const twilioRoutes = require('./routes/twilioRoutes');
const onboardingRoutes = require('./routes/onboarding');
const exotelRoutes = require('./routes/exotelRoutes');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const phoneRoutes = require('./routes/phone');
const demoRoutes = require('./routes/demo');
const webhookRoutes = require('./routes/webhook');

app.use('/auth', authRoutes);
app.use('/calls/twilio', twilioRoutes);
app.use('/calls/exotel', exotelRoutes);
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
app.use('/knowledge-base', knowledgeBaseRoutes);
app.use('/phone', phoneRoutes);
app.use('/demo', demoRoutes);
app.use('/api/webhook', webhookRoutes);

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

// ------- Global Error Handler -------
app.use((err, req, res, next) => {
  console.error('Unhandled request error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// ------- Start Server -------
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bavio AI Backend running on port ${PORT}`);

  // ── Supabase Storage Cleanup Cron ──────────────────────────────────────
  // Deletes TTS audio files older than 24 hours from the tts-audio bucket.
  // Runs once on startup, then every 24 hours.
  const { cleanupOldTtsFiles } = require('./services/storage/storageService');

  const runCleanup = () => {
    cleanupOldTtsFiles().catch(err =>
      console.error('[CRON] TTS cleanup failed:', err.message)
    );
  };

  // Run once at startup (clears any leftover files from previous deploys)
  runCleanup();

  // Then every 24 hours
  setInterval(runCleanup, 24 * 60 * 60 * 1000);

  console.log('[CRON] TTS audio cleanup scheduled every 24h');

  // ── Monthly Minutes Reset Cron ──────────────────────────────────────────
  // Resets minutes_used to 0 for all businesses on the 1st of each month.
  // Checks every hour and triggers when date is the 1st at midnight.
  const { resetMonthlyMinutes } = require('./middleware/planEnforcement');

  let lastResetMonth = -1; // Track to prevent double resets

  const checkMonthlyReset = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    
    // Reset on the 1st of each month, but only once per month
    if (currentDate === 1 && currentMonth !== lastResetMonth) {
      lastResetMonth = currentMonth;
      console.log('[CRON] Triggering monthly minutes reset...');
      resetMonthlyMinutes().catch(err =>
        console.error('[CRON] Monthly reset failed:', err.message)
      );
    }
  };

  // Check every hour
  setInterval(checkMonthlyReset, 60 * 60 * 1000);
  
  // Also check on startup in case server restarted on the 1st
  checkMonthlyReset();
  
  console.log('[CRON] Monthly minutes reset scheduled (checks hourly, runs on 1st)');
});

// ------- WebSocket Server Setup -------
const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });
const wsClients = new Map();
app.set('wsClients', wsClients);

wss.on('connection', (ws, req, businessId) => {
  console.log(`[WS] Client connected for business ${businessId}`);
  wsClients.set(businessId, ws);

  ws.on('close', () => {
    console.log(`[WS] Client disconnected for business ${businessId}`);
    if (wsClients.get(businessId) === ws) {
      wsClients.delete(businessId);
    }
  });
});

server.on('upgrade', (request, socket, head) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
    const match = pathname.match(/^\/ws\/onboarding\/([^/]+)$/);

    if (match) {
      const businessId = match[1];
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, businessId);
      });
    } else if (pathname === '/api/call-stream/ws') {
      const { twilioWss } = require('./routes/callStream');
      twilioWss.handleUpgrade(request, socket, head, (ws) => {
        twilioWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    console.error('[WS UPGRADE] Upgrade handling error:', err);
    socket.destroy();
  }
});

module.exports = app;

