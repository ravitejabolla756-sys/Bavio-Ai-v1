# Bavio AI

Bavio AI is an enterprise-grade autonomous voice agent platform designed to streamline business communications. This canonical repository contains the core services for the Bavio AI platform, enabling seamless real-time voice processing, intelligent lead capture, and workflow automation.

## Project Architecture

This is a monorepo consisting of:

- **`backend/`**: A robust, production-ready Node.js and Express server handling telephony integrations, AI orchestration, billing, and API services.
- **`frontend/`**: A high-performance, responsive web application built with Next.js 14, TypeScript, and Tailwind CSS.

---

## Tech Stack

- **Backend Architecture**: Node.js, Express.js
- **Database & Auth**: PostgreSQL (Supabase), Supabase Auth
- **AI & Telephony**: Bavio AI Voice, Twilio, Exotel
- **Payments**: Dodo Payments, Razorpay
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion

---

## Local Development Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables securely (see Security section below):
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *The backend will be available at `http://localhost:5000`.*

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:3000`.*

*Note: The frontend automatically proxies `/api/*` requests to the backend in local development.*

---

## Deployment

### Backend (AWS Deployment)
The backend is configured and optimized for deployment on Amazon Web Services (AWS).
- **Environment**: AWS EC2 / ECS / Elastic Beanstalk
- **Root Directory**: `backend/`
- **Start Command**: `node server.js`
- **Health Check Path**: `/health`

### Frontend (Vercel)
- **Framework**: Next.js
- **Root Directory**: `frontend/`
- **Environment Configuration**: Set `BACKEND_URL` to your production AWS backend endpoint.

---

## Security & Secrets Management 🔒

**CRITICAL: Never commit API keys or secrets to version control.**

All `.env` files are ignored by default via `.gitignore`. 

### Production Secrets Management
When deploying to AWS, do **not** use static `.env` files. Ensure you manage environment variables securely using industry standards:
- **AWS Secrets Manager**: Recommended for storing database credentials, API keys, and third-party tokens.
- **AWS Systems Manager (SSM) Parameter Store**: Ideal for general configuration data.
- Ensure appropriate IAM roles are assigned so only authorized instances/services can read these secrets.

### Required Environment Variables
The following keys are required for the platform to function correctly. Ensure these are injected securely into your AWS and Vercel environments:

**Backend (AWS):**
```text
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

**Frontend (Vercel):**
```text
BACKEND_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Core Endpoints Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Application health check |
| POST | `/auth/signup` | Register a new business workspace |
| POST | `/auth/login` | Authenticate and retrieve token |
| GET | `/auth/profile` | Retrieve business profile |
| POST | `/billing/subscribe` | Initialize subscription |
| GET | `/assistants/:clientId` | Retrieve configured AI agents |
| GET | `/calls/:clientId` | Retrieve structured call logs |
| GET | `/usage/:clientId` | Retrieve platform usage analytics |
