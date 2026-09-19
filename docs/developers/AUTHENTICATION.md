# API Authentication

The backend supports authenticated sessions and Bavio API-key paths through the V1 flex-auth middleware. The frontend stores a Bavio token/client identifier in browser local storage and sends a bearer token to the API; exact production token lifetime and revocation policy require confirmation.

Keep API keys, Supabase service keys, JWT secrets, provider credentials, webhook secrets, and encryption keys on the server or secure secret manager. Never place service-role keys in browser code or commit `.env` files. Every request must be scoped to the authorized Workspace; authentication alone is not tenant authorization.
