require('dotenv').config();

// Enforce environment validation on startup when running in production
if (process.env.NODE_ENV === 'production') {
    const requiredEnv = [
        'DATABASE_URL',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET',
        'OPENAI_API_KEY',
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'DODO_API_KEY',
        'DODO_WEBHOOK_SECRET',
        'DODO_STARTER_PRODUCT_ID',
        'DODO_GROWTH_PRODUCT_ID',
        'DODO_SCALE_PRODUCT_ID',
        'REDIS_URL',
        'PUBLIC_API_BASE_URL',
        'VOICE_WEBSOCKET_URL'
    ];
    const missing = [];
    for (const key of requiredEnv) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        console.error('❌ CRITICAL: Missing required environment variables for production startup:', missing.join(', '));
        process.exit(1);
    }
}

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
const PRODUCTION_ORIGINS = [
  'https://bavio.in',
  'https://www.bavio.in',
];

const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'https://bavio.vercel.app',
  'https://alaya-osteopathic-suppliantly.ngrok-free.dev',
];

// Pattern for Vercel preview deployments (bavio-ai-v1-*.vercel.app)
const VERCEL_PREVIEW_PATTERN = /^https:\/\/bavio-ai-v1-[a-z0-9-]+-ravitejabolla756-3583s-projects\.vercel\.app$/;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server, etc.)
    if (!origin) return callback(null, true);

    const isProductionOrigin = PRODUCTION_ORIGINS.includes(origin);
    const isDevelopmentOrigin = DEVELOPMENT_ORIGINS.includes(origin);
    const isVercelPreview = VERCEL_PREVIEW_PATTERN.test(origin);

    if (isProductionOrigin || isDevelopmentOrigin || isVercelPreview) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from unrecognized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'api-subscription-key']
};


// ------- Global Middleware -------
app.set('trust proxy', 1); // Trust first proxy (ngrok / load balancer)

// Conditional JSON body parsing (bypasses webhooks to preserve raw payload)
app.use((req, res, next) => {
  if (req.originalUrl === '/billing/webhook' || req.originalUrl === '/billing/dodo-webhook' || req.originalUrl.includes('/webhook')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Conditional Urlencoded body parsing
app.use((req, res, next) => {
  if (req.originalUrl === '/billing/webhook' || req.originalUrl === '/billing/dodo-webhook' || req.originalUrl.includes('/webhook')) {
    next();
  } else {
    express.urlencoded({ extended: false })(req, res, next);
  }
});

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

const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const phoneRoutes = require('./routes/phone');
const demoRoutes = require('./routes/demo');
const webhookRoutes = require('./routes/webhook');
const integrationsRoutes = require('./routes/integrations');
const pricingRoutes = require('./routes/pricing');
const userRoutes = require('./routes/user');

app.use('/auth', authRoutes);
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
app.use('/knowledge-base', knowledgeBaseRoutes);
app.use('/phone', phoneRoutes);
app.use('/demo', demoRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/integrations', apiLimiter, integrationsRoutes);
app.use('/pricing', pricingRoutes);
app.use('/user', apiLimiter, userRoutes);

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

  // ⏰ 5-Minute Free Trial Expiry Alert Cron ⏰
  // Checks every 60 seconds for active trials that created 25-30 mins ago and haven't received an alert.
  const checkTrialExpirations = async () => {
    try {
      const expiringList = await db.query(`
        SELECT id, name, email, plan, plan_name, country_code, created_at
        FROM businesses
        WHERE plan_name = 'free_trial'
          AND status = 'active'
          AND trial_expiry_alert_sent = false
          AND created_at <= NOW() - INTERVAL '25 minutes'
          AND created_at >= NOW() - INTERVAL '30 minutes'
      `);

      if (expiringList.rows.length === 0) return;

      const emailService = require('./services/emailService');
      
      for (const biz of expiringList.rows) {
        try {
          const planKey = (biz.plan || 'pro').toLowerCase();
          const isIndia = (biz.country_code || 'IN').toUpperCase() === 'IN';
          
          let planName = 'Growth plan';
          let planAmount = isIndia ? '₹2,999' : '$36';
          
          if (planKey === 'starter') {
            planName = 'Starter plan';
            planAmount = isIndia ? '₹1,499' : '$18';
          } else if (planKey === 'enterprise' || planKey === 'scale') {
            planName = 'Scale plan';
            planAmount = isIndia ? '₹5,999' : '$72';
          }

          const subject = "⏰ Your free trial expires in 5 minutes";
          const body = `Hi ${biz.name},

Your 30-minute free trial is ending soon.

In 5 minutes, we'll charge ${planAmount} for your ${planName}.

If you need more time, [Extend Trial for 24h]

Otherwise, your subscription continues automatically.

Bavio Team`;

          await emailService.sendMail(biz.email, subject, body);

          // Mark as alerted
          await db.query(
            'UPDATE businesses SET trial_expiry_alert_sent = true WHERE id = $1',
            [biz.id]
          );
          console.log(`[CRON] Sent trial pre-expiry alert to ${biz.email}`);
        } catch (bizErr) {
          console.error(`[CRON] Failed to send trial alert to ${biz.email}:`, bizErr.message);
        }
      }
    } catch (err) {
      console.error('[CRON] checkTrialExpirations error:', err.message);
    }
  };

  // Run check every 60 seconds
  setInterval(checkTrialExpirations, 60 * 1000);
  console.log('[CRON] 5-minute trial pre-expiry alert cron scheduled (checks every 60s)');
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
      const twilio = require('twilio');
      const token = process.env.TWILIO_AUTH_TOKEN;
      const signature = request.headers['x-twilio-signature'] || request.headers['X-Twilio-Signature'];
      const isProd = process.env.NODE_ENV === 'production';
      const isPlaceholder = !token || token.includes('your_');

      if (isProd && isPlaceholder) {
        console.error('[WS UPGRADE] Twilio Auth Token not configured in production. Aborting.');
        socket.destroy();
        return;
      }

      if (!isPlaceholder) {
        const publicBaseUrl = process.env.PUBLIC_API_BASE_URL || `http://${request.headers.host || 'localhost'}`;
        const url = publicBaseUrl + request.url;
        const isValid = twilio.validateRequest(token, signature, url, {});
        if (!isValid) {
          console.error(`[WS UPGRADE] Twilio WebSocket signature validation failed for URL: ${url}`);
          socket.destroy();
          return;
        }
        console.log(`[WS UPGRADE] Twilio WebSocket signature verified successfully for: ${url}`);
      }

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

