# Bavio Security Overview

**Status:** Internal/public-draft material; review before publishing detailed architecture.

## Observed controls

- Supabase client and PostgreSQL access patterns with service-side secret configuration.
- Tenant predicates in customer-facing reads and mutations.
- RLS enabled on verified Stage 7/8/9 platform tables as defense in depth.
- Encrypted webhook signing-secret storage and signed outbound delivery.
- Twilio signature validation on provider webhook routes.
- HTTPS URL validation, redirect rejection, timeout controls, and SSRF-aware destination handling for webhook delivery.
- ActionExecution and ExecutionEvidence records for verified Lead and webhook actions.
- Tenant/action/workflow idempotency constraints and crash-safe Stage 8 recovery paths.
- Fail-closed tenant resolution in hardened signed ingestion paths.

## Boundaries

Legacy and parallel call routes exist. Not every public claim in the current frontend is evidence of a complete control. Security review, dependency management, monitoring, incident response, backup testing, and production configuration require ongoing operational ownership.

Customers must protect credentials, restrict Workspace users, review Agent/Knowledge content, validate webhook destinations, and comply with calling and privacy law.
