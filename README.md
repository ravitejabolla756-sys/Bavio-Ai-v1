# Bavio AI — Monorepo

This is the canonical repository for the Bavio AI platform.

```
Bavio-Ai-v1/
├── backend/          # Node.js / Express production backend
└── frontend/         # Next.js production frontend
```

---

## Backend

**Stack:** Node.js, Express, PostgreSQL (Supabase), Twilio, Exotel, Bavio AI Voice, Dodo Payments, Razorpay

### Local development
```bash
cd backend
npm install
cp .env.example .env   # Fill in your credentials
node server.js
# → http://localhost:5000
```

### Key endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/signup` | Register business |
| POST | `/auth/login` | Login |
| GET | `/auth/profile` | Get business profile |
| POST | `/onboarding/save-step` | Save onboarding step |
| POST | `/onboarding/complete-trial` | Activate free trial |
| POST | `/billing/subscribe` | Create Dodo subscription |
| POST | `/billing/razorpay/create-order` | Create Razorpay order |
| GET | `/billing/status/:id` | Get subscription status |
| GET | `/assistants/:clientId` | List AI agents |
| GET | `/calls/:clientId` | Get call logs |
| GET | `/usage/:clientId` | Get usage stats |
| GET | `/knowledge-base` | List knowledge documents |
| GET | `/integrations` | List integrations |

### Railway Deployment
- **Root directory:** `backend/`
- **Start command:** `node server.js`
- **Health check path:** `/health`

---

## Frontend

**Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase Auth

### Local development
```bash
cd frontend
npm install
cp .env.local.example .env.local   # Fill in your credentials
npm run dev
# → http://localhost:3000
```

The frontend proxies all `/api/*` requests to the backend via `next.config.mjs`.  
Set `BACKEND_URL=http://localhost:5000` for local dev.

### Vercel Deployment
- **Root directory:** `frontend/`
- **Framework:** Next.js (auto-detected)
- **Environment variable:** `BACKEND_URL=https://<your-railway-url>.up.railway.app`

---

## Environment Variables Summary

### Backend (set in Railway)
```
PORT, NODE_ENV, DATABASE_URL
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
JWT_SECRET
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_REGION, EXOTEL_SUBDOMAIN
BAVIO_AI_API_KEY
DODO_API_KEY, DODO_STARTER_PRODUCT_ID, DODO_GROWTH_PRODUCT_ID, DODO_SCALE_PRODUCT_ID, DODO_WEBHOOK_SECRET
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
WEBHOOK_BASE_URL, FRONTEND_URL
```

### Frontend (set in Vercel)
```
BACKEND_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
