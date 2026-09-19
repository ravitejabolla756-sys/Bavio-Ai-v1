# Bavio Cookie and Browser Storage Policy

**STATUS: Draft for legal review**  
**Effective date:** `[EFFECTIVE_DATE]`

## What the audited frontend uses

- `bavio_auth` and `bavio_onboarding_completed` cookies for authentication/onboarding routing.
- `localStorage` values for Bavio token, client identifier, display name, authentication message rotation, and theme preference.
- `sessionStorage` for selected country context.
- Supabase auth client session behavior in the authentication callback.

The repository audit did not establish Google Analytics, Meta Pixel, advertising cookies, or a consent-management vendor. Do not add those providers to public notices unless implementation changes and the notice is updated.

## Choices and deletion

Users can clear browser storage or sign out. Clearing storage can end the local browser session and may remove preferences; it does not delete server-side account, call, Lead, or billing data. Server-side privacy requests use `[PRIVACY_EMAIL]`.

## Legal review required

Confirm cookie classification, consent requirements by audience and jurisdiction, cookie names after release hardening, retention, and whether Supabase auth creates additional browser storage in production.
