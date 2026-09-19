# Bavio Data Inventory

| Category | Examples | Purpose | Storage | Retention | Subprocessors | Customer configurable? | Deletion/status |
|---|---|---|---|---|---|---|---|
| Account/Workspace | name, email, business settings | authentication and service configuration | PostgreSQL/Supabase | Not configured globally | Supabase | Partly | No complete self-service deletion verified |
| Telephony | caller number, CallSid, duration, timestamps | route and persist calls | PostgreSQL/provider | Not configured globally | Twilio | Phone/provider choices | Provider and app deletion behavior requires review |
| Conversation | transcript, call metadata, recording reference | review and understanding | PostgreSQL/Supabase Storage where used | Not configured globally | Supabase and configured AI providers | Agent/phone/recording path | Request-based process only |
| AI | prompts, Knowledge context, outputs | operate Agent and extraction | Runtime/provider plus selected DB fields | Provider-specific/unknown | AI providers | Yes | Requires provider/account review |
| Lead | phone, name, intent, notes | Bavio intake record | PostgreSQL | Not configured globally | Supabase | Customer input | No complete purge route verified |
| Action/Workflow | execution status, evidence, delivery metadata | prove technical outcomes | PostgreSQL | Not configured globally | Supabase, webhook destination | Workflow/action configuration | No general purge policy verified |
| Billing | plan, usage, subscription/payment references | billing and entitlements | PostgreSQL/provider | Commercial policy unknown | Dodo path | Plan choices | Processor request path required |
| Browser state | auth cookies, localStorage tokens/theme, country session | auth routing and preferences | User browser | Browser-controlled | None established | User/browser | Clear browser storage; server data remains |
