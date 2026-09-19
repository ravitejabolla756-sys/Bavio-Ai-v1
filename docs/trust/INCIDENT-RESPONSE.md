# Bavio Incident Response Draft

**Status:** Draft for operational and legal review.

## Preparation

Maintain owner contacts, provider contacts, access to logs, deployment history, secret rotation procedures, and a current subprocessor list. Contacts: `[SECURITY_EMAIL]`, `[INCIDENT_OWNER]`.

## Detection and triage

Capture the time window, affected tenant, route/provider, safe identifiers, error codes, and observed impact. Do not copy transcripts, recordings, secrets, tokens, or full customer payloads into ordinary incident channels.

## Containment

Use the smallest safe action: disable a compromised key or binding, suspend abusive traffic, rotate affected secrets, isolate a provider route, or pause a delivery path. Preserve evidence and tenant boundaries.

## Notification and recovery

Determine whether customer, provider, regulator, or individual notification is required. Target notification period: `[INCIDENT_NOTIFICATION_PERIOD]`. Restore service only after validation and document residual risk.

## Legal review required

Confirm severity classes, roles, response targets, evidence retention, notification triggers, communications approval, and post-incident review.
