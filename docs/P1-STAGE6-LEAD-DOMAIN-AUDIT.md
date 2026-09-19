# Stage 6 Lead domain audit — before UI implementation

Scope: individual Lead records at `/dashboard/leads`, not a Customer database, identity merge or memory system. Repository evidence, not a live data audit.

## Contracts and schema

`routes/leads.js`: POST `/leads`, GET `/leads/:client_id`, PATCH `/leads/:id`; authenticated tenant is `req.user.id`. Existing list ignores the client ID path and returns all of that authenticated business's rows. Update scopes ID plus business. No delete/archive API.

`sql/reconcile_schema.sql` defines UUID lead/business/client/call IDs; phone, caller_number, name, caller_name, intent, budget, location, notes, status, appointment_time, full_transcript, summary, call_duration and created_at. No email, updated_at or field-level provenance. Earlier `database/schema.sql` uses serial IDs and numeric budgets: migrations/live schema need verification, not assumption. Current controller relies on the reconciled business/phone/name/location fields. Supported status check: new, contacted, qualified, converted, lost. Persisted status does not prove external conversion or CRM activity.

The trigger copies business/client and phone/caller_number aliases, but does not normalize phone or email. No Lead contact uniqueness rule. One phone can have many leads; writers may insert per turn/call. Outcome extraction uses a non-atomic NOT EXISTS business/call guard, not a general uniqueness constraint. No automatic merging or related-record grouping is justified.

## Concrete provenance risks

- Historical HEAD version of `services/outcomeExtractionService.js`: failed model extraction substituted budget `80 Lakhs`, location `Kondapur, Hyderabad`, property `3BHK`, timeline `Within 2 months`, scores 85/40 and answer confidence 0.95. Those values could propagate into leads. Current Stage 1 working copy removes these fallbacks, but does not backfill history or store per-field provenance on leads.
- Current `routes/webhook.js`: assigns `Anonymous Caller`, `General inquiry`, `N/A`, `Unknown`, a default sentiment and `qualified` for captured test leads.
- Current `voice/sessions/VoiceWorkerSession.js`: double-model failure inserts an `unknown` phone callback lead with emergency fallback notes. This is an operational failure signal, not proof of customer intent.
- Current `controllers/twilioCallController.js`: multiple insertion paths, JSON-generated notes; one writes appointment/time data into budget and defaults intent to `inquiry`.
- Current `routes/callStream.js`: missing phone becomes `unknown`; later call_sid linkage update has no explicit tenant predicate. Stage 6 reads must independently verify the call tenant.
- `voice/sessions/ModularVoiceSession.js` can create a lead without a phone, in conflict with the reconciled NOT NULL schema; this may fail depending on deployed schema.

Thus contact labels, qualification, intent, budget, location, notes and summary are not automatically verified facts. No confidence, fit score or default-agent association belongs in this UI. Existing writer risks remain outside this read/edit presentation task; no historical rows will be changed.

## Implementation boundary

Add bounded metadata reads on the existing resource and a tenant-scoped detail read. Only return a conversation reference after a tenant-qualified join; never return an unverified cross-tenant call ID. No transcript in list or detail payloads. Keep legacy endpoints compatible. Edits use existing name/status/notes fields with explicit save; notes remain a shared mixed-origin field, not human-only notes. Intent/budget/location remain read-only context.

Design: approved warm canvas #f7f4ee, open surface #fffdf9, ink #0a0a0a, secondary #514b43, orange #ff6b00, error #a53629. Geist Sans for contact/section hierarchy, Geist Mono only for IDs/utility labels. Signature is an open contact → opportunity → source relationship, with source evidence visibly separate from unverified understanding. Mobile collapses into one ordered column. No new visual theme, metric cards, score or sales pipeline.

Future Customer work must explicitly define tenant-scoped normalized identity, identity proof/merge/split rules, retention and field provenance before attaching many leads/conversations to one durable entity. Preserve every current lead ID.
