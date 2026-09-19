# BAVIO P1 Stage 7.2 — Controlled Webhook Delivery Report

Status: implemented as a narrow internal execution substrate; live external delivery and live database persistence remain unverified.

1. **Existing infrastructure:** `webhooks` stores tenant ownership, endpoint URL, subscribed events, signing secret, status, and timestamps; `webhook_deliveries` stores delivery identity, event, payload metadata, response status, attempt count, and error state.
2. **Capability classification:** B — production-shaped tenant-configured delivery existed, but required targeted security and execution hardening.
3. **Tenant model:** every configuration and delivery row carries `business_id`; action lookup requires both `webhookConfigurationId` and the resolved tenant.
4. **SSRF findings:** prior filtering was string-based, omitted private ranges/IPv6/metadata coverage, allowed HTTP, and axios followed redirects.
5. **SSRF protections:** production configuration requires HTTPS; DNS answers are resolved and checked against loopback, private, link-local, metadata, reserved, multicast, IPv4, and IPv6 ranges; the resolved address is pinned for the request.
6. **Redirect behavior:** redirects are disabled with `maxRedirects: 0`; no redirect destination is followed or trusted.
7. **Secret handling:** outgoing HMAC signing is preserved; secrets are not returned by the V1 create API, placed in action results/evidence, or logged. Existing storage remains backward-compatible plaintext storage and is an open hardening concern.
8. **Payload contract:** the action sends the existing JSON envelope shape (`id`, `type`, `created_at`, `data`) plus `execution_id`; no model-controlled URL, headers, cookies, authorization, or host fields are accepted.
9. **Action contract:** internal `bavio.webhook.deliver` / “Send webhook” accepts an existing configuration identity and tenant context, then resolves the configured endpoint.
10. **Success semantics:** only HTTP 2xx is success; the verified outcome is “Webhook accepted by configured endpoint.”
11. **Failure semantics:** 3xx, 4xx, 5xx, timeout, DNS, blocked destination, and connection errors are failed outcomes with safe error codes.
12. **ActionExecution:** the service persists `started`, performs one bounded attempt, then persists `succeeded` or `failed`; it never exposes a generic `/actions/run` route.
13. **ExecutionEvidence:** successful and failed attempts write `external_webhook_delivery` evidence tied to the real `webhook_deliveries.id`, configuration ID, HTTP status, duration, and attempt count.
14. **External outcome:** no CRM sync, lead sync, notification, booking, or customer-side mutation is claimed; only endpoint acceptance is claimed.
15. **Idempotency:** a stable invocation ID is stored as `action_executions.idempotency_key` with a tenant/action unique index; duplicate and concurrent attempts return the existing execution rather than send twice.
16. **Retry behavior:** the new action performs one attempt. The older event-driven `dispatchWebhook` path retains its existing maximum of three attempts for compatibility, with retries only for network/5xx classes; it is not represented as the verified action.
17. **Timeout:** outbound requests are bounded to 5 seconds.
18. **Distributed consistency:** external delivery and database finalization are not atomic. If delivery succeeds but delivery/evidence persistence fails, the service reports `ACTION_FINALIZATION_FAILED` and does not automatically replay the request.
19. **Controlled sink:** a test-only local HTTP sink records a request and returns 204; production code cannot enable the loopback allowance.
20. **Live external verification:** OPEN — no real external endpoint/customer system was called.
21. **Database verification:** OPEN — no safe isolated Postgres/Supabase credentials were available for applying and reloading migrations.
22. **Conversation integration:** no UI or activity row was added; the service accepts a real `conversationId` when an internal caller has one.
23. **Lead integration:** no inferred Lead relationship was added; the service accepts a real `leadId` only when supplied by the caller.
24. **Security tests:** URL schemes, private IPv4, private IPv6, metadata, tenant/config isolation, unknown configuration, event subscription, redirects, and secret boundaries pass.
25. **Delivery tests:** 204, 400, 401, 403, 500, 302, timeout, connection failure, and duplicate invocation cases pass.
26. **Stage 7.1 regressions:** Stage 7.1 tests pass, including strict signatures, fail-closed tenant resolution, transaction/evidence behavior, validation, and no first-business fallback.
27. **Frontend regressions:** no frontend files changed; no browser run was necessary for this backend-only stage.
28. **Files modified:** webhook security/sender/action services, V1 webhook response sanitization, database startup migration runner, Stage 7.2 tests, and this report.
29. **Migrations:** `029_webhook_action_execution_fields.sql` adds idempotency, attempt/duration, webhook configuration, delivery, HTTP status, and safe metadata fields.
30. **Launch-blocker matrix:**
    - Stage 7.1 tenant fallback — **RESOLVED**
    - Action DB migration verification — **OPEN**
    - Lead action live persistence — **OPEN** from Stage 7.1
    - Webhook external delivery — **OPEN**
    - Webhook SSRF hardening — **RESOLVED locally; production DNS/egress verification OPEN**
    - Agents live persistence — **OPEN**
    - Knowledge live persistence — **OPEN**
    - Knowledge retrieval adoption — **OPEN**
    - Provider audio — **OPEN**
    - Authentication fallback risk — **OPEN**
31. **Stage 7.3 recommendation:** do not add an Actions UI or Workflows. First obtain an isolated database and controlled HTTPS endpoint, apply/reload migrations, perform one real `bavio.webhook.deliver` verification, then review secret-at-rest encryption and legacy retry migration separately.

## Verification commands

- `node --check services/webhookSecurity.js`
- `node --check services/webhookService.js`
- `node --check services/bavioWebhookAction.js`
- `node test-stage7.2.cjs`
- `node test-stage7.1.cjs`
- `node test-stage6.cjs`

No commit, push, deployment, production mutation, Actions UI, workflow, or customer webhook delivery was performed.
