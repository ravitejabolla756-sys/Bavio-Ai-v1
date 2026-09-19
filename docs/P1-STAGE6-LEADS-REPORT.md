# P1 Stage 6 — Leads / Customer Context Foundation

Implemented locally in `C:\Startup\bavio-backend`. No deployment, commit, push, production mutation, identity merge or historical cleanup. Stage 7 has not started. Await visual approval.

## 1. Existing route

`/dashboard/leads` and navigation label Leads are preserved. Detail uses `/dashboard/leads?lead=<id>`, matching Overview's existing links. Direct reload loads only that detail, not the lead list.

## 2. Backend schema and contracts

See `P1-STAGE6-LEAD-DOMAIN-AUDIT.md` for the pre-implementation audit. Reconciled schema contains lead/business/client/call IDs, phone/caller_number, name/caller_name, intent, budget, location, notes, status, appointment_time, full_transcript, summary, call_duration and created_at. No email, updated_at or field-level provenance was found. Older schema files differ in ID/budget types; deployed schema remains unverified.

Existing authenticated POST, list and PATCH contracts remain. Added opt-in `GET /leads/:client_id?view=context&limit=20&q=...&status=...&cursor=...` and `GET /leads/records/:id`. List is cursor-paginated, capped at 50, with twenty rows requested by the UI. Metadata excludes notes and transcripts. Detail includes recorded context but no transcript. Existing unparameterized list remains compatible.

## 3. Lead → Conversation linkage

Only a call joined through `lead.call_id` and the authenticated workspace becomes a link. Agent name comes from that call's tenant-qualified assistant, never a default agent. Inaccessible references become “Conversation link unavailable”; absent references become “No conversation linked.” Raw inaccessible call IDs are not returned by the new reads.

## 4. Historical provenance risks

Historical outcome extraction could persist fallback budget/location, qualification scores and other inferred values. Current writers still include placeholder contact values, automatic qualification, mixed JSON notes, appointment data stored as budget, and a model-failure-generated callback lead. These are concrete code risks, not proof that every live record is contaminated. No live population was audited or altered.

## 5. Files modified

Paths relative to canonical repository:

- `backend/controllers/leadReads.js`
- `backend/controllers/leadsController.js`
- `backend/routes/leads.js`
- `backend/services/leadReadQuery.js`
- `backend/sql/027_lead_context_read_indexes.sql` — prepared, not applied
- `backend/test-stage6.cjs`
- `frontend/src/features/leads/model.ts`
- `frontend/src/features/leads/service.ts`
- `frontend/src/features/leads/Leads.tsx`
- `frontend/src/features/leads/LeadList.tsx`
- `frontend/src/features/leads/LeadDetail.tsx`
- `frontend/src/features/leads/LeadEditor.tsx`
- `frontend/src/features/leads/leads.module.css`
- `frontend/src/app/dashboard/leads/page.tsx`
- `frontend/src/app/dashboard/layout.tsx` — Leads breadcrumb/checklist suppression only
- `frontend/src/app/dashboard/page.tsx` — shared contact formatting and provenance copy only
- `frontend/src/lib/api.ts` — re-export canonical Lead type
- `frontend/test-stage6.cjs`
- `frontend/test-stage6-browser.cjs`
- `docs/P1-STAGE6-LEAD-DOMAIN-AUDIT.md`, this report and Stage 6 screenshots.

Prior dirty changes were preserved. Existing regression harnesses refreshed their own screenshot artifacts. Scoped diff whitespace check passes; unrelated marketing whitespace was not cleaned up.

## 6. Leads list

Semantic open list with keyboard-accessible links. Contact is dominant, followed by stored status, captured intent and created date. Explicit page count, no workspace aggregate or conversion-rate claim. No qualification scores, export feature, fabricated action or guessed agent.

## 7. Detail experience

Open contact / opportunity / conversation sections, followed by shared notes. Lazy detail loads independently of list. Missing contact/date/context values stay explicit. Long text wraps and notes scroll. No Customer database or competing route.

## 8. Status semantics

Schema-supported values: new, contacted, qualified, converted, lost. Labels represent stored status only. Neutral indicators avoid presenting qualified/converted as verified outcomes. New uses the approved orange accent. Unknown legacy values display without inventing a mapping; editing requires a supported status.

## 9. Intent and extracted context

Intent, budget, location and summary remain read-only and labeled unverified. Values are not interpreted into currency, fit scores or confirmed bookings. Detail explains that fields may be extracted, edited or legacy. Known contact placeholder literals are omitted from identity presentation, not deleted from storage.

## 10. Search

Parameterized, case-insensitive literal substring search over stored name, phone and lead ID. Explicit Apply filters; no request per keystroke. No email search because no email contract was found. No semantic-search claim.

## 11. Filters

Server-side supported-status filter, combined with search and cursor pagination. Filter changes reset pagination. No invented agent, date, quality or customer filters. Search scans matching tenant records; tenant-scale query plans still require live validation.

## 12. Edit behavior

Existing name/status/notes PATCH only. Supported field/type/length validation added server-side; tenant predicate retained. Save checks returned ID and all edited values, then reloads detail. Failed or unconfirmed saves retain input. Cancel asks before discarding changes; browser unload warns on dirty edits. No phone/email mutation, archive or delete is exposed.

## 13. Notes behavior

Explicitly called Shared notes. Existing notes may contain generated JSON, extraction or operator edits. Save replaces that field; no invented autosave, author trail or human-only provenance. Maximum 50,000 characters, with complete serialized request checked against the existing 100 KiB server limit.

## 14. Related records

Not implemented: normalized identity and deterministic matching contracts are absent. Duplicate phone records remain separate. No related-record screenshot is applicable.

## 15. Identity normalization

Existing triggers synchronize aliases but do not normalize phone numbers. No lead phone/email uniqueness or durable Customer identity was found. Presentation trims outer whitespace and suppresses known placeholder literals without changing phone formatting, persisting normalization or merging records.

## 16. Empty/error states

Separate No leads yet, No matching leads, No more leads, Unable to load leads, Lead unavailable and inaccessible conversation states. Errors never become empty arrays. Empty workspace links to Conversations; list/detail failures offer accurate load retries.

## 17. Mobile behavior

List and detail tested at 430/390/375/360, plus desktop/tablet widths. Rows stack contact/status/context/date. Detail becomes one ordered column rather than excessive tabs. Long contact strings wrap; controls have at least 44px height and visible focus. Tests check all three detail sections for collisions and page overflow.

## 18. Tenant isolation

New reads use authenticated `req.user.id`, ignoring a forged client path identity. Detail scopes lead ID plus tenant; call and assistant joins independently scope tenants. PATCH scopes lead ID plus tenant and rejects unsupported fields. Tests cover inaccessible IDs, query parameters, missing authentication and failure responses. This is code/controlled-test evidence, not a live multi-tenant penetration test. Shared authentication's previously reported hardcoded JWT fallback remains a launch risk.

## 19. Overview integration

Canonical Lead type is re-exported by the existing API module. Overview minimally uses `contactOf` and labels intent as unverified context; layout is unchanged. Its existing deep links now resolve to independent detail reads. Overview browser regression passes. Its legacy unbounded list fetch is not redesigned in this stage.

## 20. Conversations integration

Lead detail links to `/dashboard/calls/<id>` only for a tenant-confirmed relationship. Conversations itself is unchanged; no reverse association API or speculative reference was added. Regression passes with its existing 46 out-of-scope shell/browser errors noted by that harness; not an application-wide console-clean claim. Agents and Knowledge remain unchanged and their regressions pass.

## 21. Live persistence

Unverified. No authenticated disposable live lead/workspace was established. Controlled transport tested edit → save → reload, retained failure, unconfirmed response and status changes; these are not live database receipts. No real contact record or production business data was changed.

## 22. Historical-data recommendation

Preserve history. Treat records lacking field-level source evidence as unverified; mark verified only after authorized source review. Queue suspicious fallback signatures and appointment-as-budget records as migration candidates, not automatically false records. Some literals may coincide with genuine facts. Audit current writer paths separately, introduce provenance/version/author tracking through an approved contract, and require approval for any backfill or deletion.

## 23. TypeScript

`npx tsc --noEmit` passes, including the post-build check.

## 24. ESLint

Targeted Lead feature, route, Overview and shell lint passes. Next's existing build configuration skips type/lint, so standalone checks were run.

## 25. Tests

Frontend Stage 1/5/6: 18/18 pass. Backend Stage 1/5/6: 22/22 pass. Total 40. Covers cursor bounds/ties/null dates, tenant predicates, invalid queries/updates, explicit clearing of notes, malformed responses, identity placeholders and save confirmation. Database query tests use controlled dependencies, not live SQL execution.

## 26. Build

Production build passes, 84 pages. No new dependency, durable Customer model or applied migration.

## 27. Browser QA

Lead list and detail pass all eleven widths: 1440,1366,1280,1100,1024,900,768,430,390,375,360. Covers lazy deep links/reload, inaccessible references, duplicate phones retained, missing identity, long strings, shared-note edits, failed/unconfirmed/successful saves, cancel protection, status/search filters, pagination and empty/error states. No Stage 6 page errors. Shared profile/country reads remain expected shell behavior.

Frozen Overview, Conversations, Agents and Knowledge harnesses pass. Knowledge's run was temporarily blocked by approval-service usage limits and passed after the user requested resumption. Screenshots use test-only fixtures and were visually inspected, not production customer data.

## 28. Remaining launch blockers and architecture risks

- Live authenticated persistence, deployed schema compatibility, tenant isolation and query-plan verification remain outstanding.
- Current/historical writer provenance problems require approved remediation; this UI does not cure stored data contamination.
- Shared authentication hardcoded fallback and Knowledge retrieval adoption remain previously reported blockers.
- Deploy additive backend reads before/with the frontend. Prepared concurrent read indexes must be reviewed and applied by an authorized operator, with deployed types and index validity verified; no indexes were applied here.
- Search is tenant-scoped literal substring search, not indexed semantic search. At high tenant volumes, benchmark and deliberately add an appropriate search index/service. Bounded network payloads alone do not prove database scalability.
- Existing edits have no version column or conflict detection. Shared notes remain last-write-wins; an approved revision/audit contract is needed for concurrent operator editing.
- Existing global navigation can leave an inline edit; cancel and browser unload have warnings, but comprehensive SPA navigation interception is not claimed.

UI, identity presentation, transport validation, queries and detail/editor responsibilities are separated into small modules. Keyset paging avoids deep offsets, retains timestamp precision and prevents full-transcript list downloads. Future Customer work must define tenant-scoped identity verification, merge/split, retention and provenance before linking multiple opportunities to durable identity.

## 29. Screenshot paths

Directory: `C:\Startup\bavio-backend\artifacts\stage6\`

- `leads-1440.png`
- `lead-detail-1440.png`
- `leads-390.png`
- `lead-detail-390.png`
- `leads-empty-1440.png`

## 30. Recommended Stage 7

After visual approval: Actions, beginning with actual execution contracts, approval/idempotency rules and evidence-backed outcomes. Do not equate inferred intent or internal lead creation with external execution. Stage 7 is not started.

The frontend-design skill guided the approved visual language and open contact/context/source structure; webapp-testing guided browser verification, using installed Puppeteer because Python Playwright was unavailable.
