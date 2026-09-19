# Authenticated UI Redesign Queue

Audit date: 2026-09-15

This is a queue only. No authenticated product page was redesigned in this audit.

## P0 — access or route-health blockers

- Local authentication cannot be verified safely because the backend is not listening on port 4000.
- The requested verification project is visible to the current Supabase CLI account, but its database host cannot be resolved from this environment. The backend .env also points to a different project, so no signup or seeded verification login was attempted against it.
- Overview, Conversations, Leads, Agents, Knowledge, Actions, Workflows, Phone Numbers, Provider Connections, Analytics, Billing, and Settings are currently auth-gated in local smoke checks.
- Dynamic detail pages have no discovered verification IDs.
- Lead detail, Agent detail, and Knowledge detail frontend routes are not present.
- A pre-existing syntax error remains in backend/scratch/setup-us-number.js; it is outside the requested auth/UI route scope but prevents an all-JavaScript syntax pass.

## P1 — verify after access is restored

- Review the current visual system on every primary authenticated page at desktop and mobile sizes.
- Review API error handling separately from explicit empty/unavailable states.
- Review the extra billing top-ups route and route ownership.
- Confirm dynamic action/workflow detail pages have stable loading/error/empty states using real verification records.

## P2 — later polish

- Accessibility, copy, and consistency polish after route health and data contracts are proven.
- Login/provider copy audit, including unsupported security claims, without changing auth behavior in this task.
