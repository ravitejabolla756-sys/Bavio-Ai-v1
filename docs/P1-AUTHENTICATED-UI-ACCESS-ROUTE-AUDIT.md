# P1 Authenticated UI Access and Route Audit

Audit date: 2026-09-15
Repository: C:\Startup\bavio-backend
Frontend origin: http://localhost:3100

## Executive result

BLOCKED. The requested Supabase project is visible to the current CLI account and reports ACTIVE_HEALTHY, but its verification database cannot be reached from this environment: both direct PostgreSQL and Supabase CLI database queries fail DNS resolution for db.qninimnubfjmyriafdgj.supabase.co. The local backend is not running, so authenticated product pages cannot yet be reliably reviewed. Production authentication was not weakened.

## 1. Signup error reproduction

The frontend /api/* rewrite was inspected from frontend/next.config.mjs. Before this audit it defaulted to https://api.bavio.in whenever BACKEND_URL was absent. The frontend has no .env, .env.local, or other env override. Therefore the browser signup caller was:

- Method: POST
- Browser URL: http://localhost:3100/api/auth/signup
- Previous rewrite destination: https://api.bavio.in/auth/signup
- Frontend caller: frontend/src/lib/api.ts via the shared api-transport
- Backend route: backend/routes/auth.js → POST /auth/signup
- Auth provider: Supabase Auth via db.createAuthClient().auth.signUp(...)

A real signup was intentionally not submitted: the available backend env targets a different Supabase project and would transmit credentials to a non-verification environment. A direct request to the external API from this environment was not usable, and the local backend at http://localhost:4000 refused connections. This is an environment/configuration blocker, not evidence that a verification signup succeeded or failed.

## 2. Root cause and safe fix

Root cause: local frontend API routing had a production default and no local override. The rewrite now uses:

- development default: http://localhost:4000
- production default: https://api.bavio.in
- explicit BACKEND_URL still wins in either environment

This change does not alter production auth and prevents local development from silently sending signup/login traffic to the production API.

Remaining blockers: the local backend is stopped; backend/.env points to Supabase project afwwcnmxbfvahqinyagm, not the requested verification project; and the root .env.verification.local database host correctly points to db.qninimnubfjmyriafdgj.supabase.co but cannot be resolved from this environment. The file also contains secrets and a database connection string; values were not copied into this report.

## 3. Auth architecture observed

POST /auth/signup calls Supabase Auth, inserts a business row, inserts an email verification record, dispatches an OTP, and only attempts a development sign-in afterward. POST /auth/login calls Supabase Auth and then requires an active businesses row. Authenticated API requests use a bearer token through backend/middleware/auth.js; the frontend dashboard shell separately requires the existing bavio_token local-storage value and the route middleware uses the bavio_auth=true cookie.

The current source includes a hard-coded fallback JWT secret in backend/middleware/auth.js when JWT_SECRET is absent. This was not changed in this audit; it should be treated as a separate security remediation before production deployment.

## 4. Workspace provisioning

Signup provisioning is currently coupled to the businesses insert in authController.signup, followed by email verification state. Login then queries businesses by the Supabase user ID and requires status = active. No safe verification signup was run, so the actual verification tenant/profile/membership chain was not asserted. No row was inserted or modified.

Expected chain: browser → Supabase user → businesses row → email verification/activation → active login/session → dashboard APIs. Current evidence proves only the source path, not a successful verification run.

## 5. Environment audit

| Variable | Side | Current source | Expected environment | Status |
|---|---|---|---|---|
| BACKEND_URL | Frontend | No frontend env file | Local: http://localhost:4000; production: explicit production API | FIXED in next.config.mjs |
| SUPABASE_URL | Backend | backend/.env | qninimnubfjmyriafdgj verification project | BLOCKED: current project differs |
| SUPABASE_ANON_KEY | Backend | backend/.env | Verification project anon key | BLOCKED: missing from verification env |
| SUPABASE_SERVICE_ROLE_KEY | Backend | backend/.env | Verification project service key, server-only | BLOCKED: missing from verification env; never expose to browser |
| DATABASE_URL | Backend | .env.verification.local | Verification database only | PRESENT and ref-matched; BLOCKED by DNS resolution |
| FRONTEND_URL | Backend | backend/.env | Local frontend origin for local auth callbacks | BLOCKED: currently points to an ngrok origin |
| JWT_SECRET | Backend | backend/.env | Development/verification-only secret via env | PRESENT but not disclosed |
| NODE_ENV | Backend | backend/.env | development locally, production in production | PRESENT: development |

## 6. Route inventory and health

The complete route inventory is in docs/UI-ROUTE-INVENTORY.md. The navigation source of truth is frontend/src/config/application-navigation.ts. Direct smoke requests to all discovered primary authenticated routes returned 307 to /login?redirect=... because no auth cookie was present. This is classified as AUTH ERROR, not EMPTY or API ERROR.

No real synthetic detail IDs were found. No dynamic URL was filled with a guessed UUID.

## 7. Screenshots

The requested authenticated-page screenshots could not honestly be captured: all primary routes stopped at the auth gate before rendering their authenticated surfaces. The browser evidence available during the audit showed the local login page and the redirect behavior. The attempted headless capture script was blocked by the local process policy (spawn EPERM), so no fabricated screenshot files were placed in artifacts/authenticated-ui-current/.

Once verification database connectivity is restored, capture the requested desktop and mobile surfaces into artifacts/authenticated-ui-current/ and replace this section with per-page paths and statuses.

## 8. Validation

| Check | Result |
|---|---|
| Frontend origin | PASS: http://localhost:3100 returned 200 for /login |
| Auth route smoke check | BLOCKED: all protected routes returned 307 to login |
| Frontend TypeScript | PASS: tsc --noEmit exit 0 |
| Frontend production build | PASS: .next/BUILD_ID generated after npm run build |
| Backend key-file syntax | PASS: server.js, auth controller, auth middleware, auth routes, database module |
| Backend all-JS syntax | BLOCKED by pre-existing backend/scratch/setup-us-number.js:13 syntax error (const Bavio VoiceAssistantId) |
| Supabase project visibility | PASS: qninimnubfjmyriafdgj is visible and ACTIVE_HEALTHY |
| Verification database connectivity | BLOCKED: DNS resolution fails for db.qninimnubfjmyriafdgj.supabase.co, including CLI HTTPS DNS resolver |
| Backend runtime | BLOCKED: port 4000 refused connection |
| Auth tests | NOT RUN: current backend env is not verification-safe and no synthetic account/session is available |
| Production-auth guard test | NOT APPLICABLE: no preview bypass was added |

## 9. Exact review URLs

These are copy-paste URLs, but they will remain auth-gated until a safe local/verification backend and synthetic session are configured:

- Overview: http://localhost:3100/workspace
- Dashboard overview: http://localhost:3100/dashboard
- Conversations: http://localhost:3100/dashboard/calls
- Conversation detail: unavailable — no real synthetic ID
- Leads: http://localhost:3100/dashboard/leads
- Lead detail: unavailable — frontend route not present
- Agents: http://localhost:3100/dashboard/assistant
- Agent detail: unavailable — frontend route not present
- Knowledge: http://localhost:3100/dashboard/knowledge
- Actions: http://localhost:3100/dashboard/actions
- Action detail: unavailable — no verified action type/record
- Workflows: http://localhost:3100/dashboard/workflows
- Workflow detail: unavailable — no real synthetic ID
- Workflow execution: unavailable — no real synthetic ID
- Phone numbers: http://localhost:3100/dashboard/phone-numbers
- Provider connections: http://localhost:3100/dashboard/integrations/voice-pipeline
- Analytics: http://localhost:3100/dashboard/analytics
- Billing: http://localhost:3100/dashboard/billing
- Settings: http://localhost:3100/dashboard/settings

## 10. Next safe unblock

Restore DNS/network access to db.qninimnubfjmyriafdgj.supabase.co, then provide the missing verification-only backend/frontend key variables and synthetic verification account/seed. Start backend on port 4000, run the normal signup/login/session path, query only that tenant for real detail IDs, capture the requested screenshots, and rerun the route health audit. No production deploy, commit, or push is needed.
