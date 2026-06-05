# Bavio AI - Complete Monorepo

Welcome to the Bavio AI codebase. This repository contains the complete, production-ready application structure for Bavio AI, including both the frontend and backend applications organized as a single monorepo.

## Project Structure

This monorepo is structured into two main directories to allow for independent deployments while keeping the codebase unified:

- `/bavio-frontend-v2/`: Contains the Next.js App Router application (React 19).
- `/bavio-backend/`: Contains the Node.js/Express server providing APIs, Webhooks, and Database connectivity (Supabase/PostgreSQL).

## Local Development

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd bavio-backend
npm install
```

Ensure your `.env` is configured correctly (refer to `.env.example`).
Start the backend server:
```bash
npm start
# or
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 2. Frontend Setup

In a new terminal window, navigate to the frontend directory:
```bash
cd bavio-frontend-v2
npm install
```

Ensure your `.env.local` is configured correctly (refer to `.env.example`).
Start the Next.js development server:
```bash
npm run dev
```
The frontend server runs on `http://localhost:3000`.

---

## Deployment Instructions

This repository is designed to be easily deployed to modern cloud providers using root directory configurations.

### Deploying the Frontend (Vercel)

1. Connect this repository to your Vercel account.
2. In the project setup, set the **Root Directory** to `bavio-frontend-v2`.
3. Set the Framework Preset to **Next.js**.
4. Configure your environment variables (e.g. `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SUPABASE_URL`).
5. Deploy! Vercel will automatically run `npm run build` from within the frontend directory.

### Deploying the Backend (Railway / Render)

1. Connect this repository to your preferred backend host (like Railway or Render).
2. Set the **Root Directory** to `bavio-backend`.
3. The host should automatically detect the Node.js environment from `package.json`.
4. Ensure the start command is `npm start` (which runs `node server.js`).
5. Configure all required environment variables for your database, Stripe/Razorpay, Twilio, JWT secret, etc.
6. Deploy!
