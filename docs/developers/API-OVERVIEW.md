# Bavio API Overview

The backend exposes authenticated V1 routes for Agents, Calls, Campaigns, Leads/Usage, Webhooks, API keys, Action reads, and Workflow reads. V1 routing is in `backend/routes/v1/index.js` and supports a bearer API key or authenticated session according to the deployed middleware.

Use the documented V1 surface only. Internal verification scripts, provider callbacks, private services, admin routes, and database operations are not public API commitments. Formal public API rate limits are not yet published.
