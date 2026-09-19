# P0 Stage 5 — Knowledge

Canonical repository: `C:\Startup\bavio-backend`. Local implementation only; no deployment, push or production mutation. Overview, Conversations, Agents and marketing were not redesigned. Await visual approval before Stage 6.

## 1. Existing route

`/dashboard/knowledge` is preserved. The route now composes a dedicated Knowledge feature.

## 2. Backend contracts discovered

`backend/routes/knowledgeBase.js` and `backend/controllers/knowledgeBaseController.js` expose authenticated text list/create/update/delete, English PostgreSQL full-text keyword search (five results), and a legacy sync endpoint. `backend/sql/009_knowledge_base.sql` stores name, content, generated word count, tenant ID and timestamps; it has tenant and full-text indexes. It has no source type, binary, URL provenance, ingestion job, readiness, failure or per-agent assignment columns.

Additive Stage 5 reads on the same resource:

- `GET /knowledge-base?view=summary&page=1&limit=20`: metadata only, stable created-at/ID order, bounded limit up to 50, one lookahead row for `hasMore`. Does not claim a workspace total.
- `GET /knowledge-base/:id`: lazy text content, scoped by both ID and authenticated business.
- The old unparameterized list is retained for existing consumers. No migration is required.

The legacy `/sync` and `/sync-vapi` handlers compile all text into one locally stored assistant system prompt selected with unordered `LIMIT 1`. Despite legacy names/comments, they do not call a provider or confirm runtime adoption. New UI deliberately does not offer this ambiguous instruction-overwrite operation; its API remains unchanged for compatibility.

## 3. Scope

Business/workspace-owned storage via `req.user.id`, not per-agent attachment. Scope is distinct from availability. Shared `requireAuth` is retained; detail, metadata, create, update and delete use authenticated tenant parameters, not client-supplied tenant IDs.

## 4. Supported ingestion

Direct persisted text only. FAQs and policies can be pasted as text. Names are not used to infer PDFs, websites or processing types.

## 5. Files modified

All paths below are relative to the canonical repository:

- `frontend/src/app/dashboard/knowledge/page.tsx`
- `frontend/src/app/dashboard/layout.tsx` — Knowledge-specific breadcrumb and suppression of unrelated checklist requests/overlay/status; no global redesign.
- `frontend/src/features/knowledge/Knowledge.tsx`
- `frontend/src/features/knowledge/SourceDialog.tsx`
- `frontend/src/features/knowledge/service.ts`
- `frontend/src/features/knowledge/knowledge.module.css`
- `backend/routes/knowledgeBase.js`
- `backend/controllers/knowledgeBaseController.js` — additive reads, create input validation, safe CRUD failure messages; preserved prior update work.
- `backend/test-stage5.cjs`
- `frontend/test-stage5.cjs`
- `frontend/test-stage5-browser.cjs`
- This report and `artifacts/stage5/*.png`.

Existing dirty files and earlier-stage changes were preserved. Existing browser regression scripts refreshed their own prior-stage artifacts when run.

## 6. Add Knowledge

Compact native modal with title, business text, size feedback, retained failed input and explicit server-confirmed save. Unsaved close/reload protection; accessible labels, named close control, Escape handling and keyboard focus wrapping. No wizard or simulated business operations.

## 7. Upload behavior

No upload endpoint/parser exists in this resource, so no file picker, drag/drop or URL import is exposed. The controller allows up to 500,000 characters, but the existing global Express JSON parser imposes the tighter 100 KiB complete-request limit. Client validation measures serialized UTF-8 JSON, including title and escaping, against that actual limit. The controller's pre-existing 50-source cap remains.

## 8. Processing semantics

Only a real pending HTTP save is shown as “Saving…”. No background Processing state or polling is invented. The requested `knowledge-processing-1440.png` records this pending-save equivalent and is not evidence of an indexing job.

## 9. Ready semantics

Persisted sources say “Stored” and “Availability unverified.” No Ready badge, ready total, sync success or “available to all agents” claim. Readiness cannot be derived from this schema.

## 10. Failure semantics

Load, detail, save and delete failures remain visible. Failed saves retain text and existing source records; failed deletes do not remove rows. There is no persisted processing-failure contract to render. CRUD database errors no longer return raw database messages to the client.

## 11. Sources list

Open rows with dominant names, text/workspace metadata, stored status and actual updated date. Twenty metadata records per page, stable server order, bounded next/previous navigation. No document content is fetched by the Knowledge list. No fabricated global totals or quality metrics.

## 12. Source detail

Lazy authenticated read with actual saved text and timestamps. Text renders as React text, not executable HTML. The scrollable preview exposes neither embeddings nor inferred provenance. Missing/malformed details and ownership failures do not become empty content.

## 13. Delete behavior

Dedicated confirmation view. Row removal requires explicit API success. Copy warns that previously copied assistant instructions are not removed. Failed deletion is visible and retryable; no production source was deleted during verification.

## 14. Retry behavior

Retry loading at list/detail level; retained forms can resubmit after failure. No fake “Retry processing” or reload-as-reprocessing button.

## 15. Search/filter behavior

Explicit “Filter names on this page” client filter. No semantic-search claim. The existing keyword endpoint remains available but is not presented as source-wide semantic retrieval. No status/type filters because all stored records have the same known type and unknown availability.

## 16. Empty state

First-run business knowledge prompt with examples and Add knowledge. API failure has its own error/retry view, never an empty array fallback. An exhausted page offers return navigation.

## 17. Mobile

Open stacked rows at 430/390/375/360; visible primary add action, wrapped long names and URLs, readable status and dates. No horizontal page overflow in controlled checks. Dialog bounds checked at all four widths and 740px height; scrolling retains access to lower controls.

## 18. Tablet

1024/900/768 checked. Lower-priority updated column collapses to keep source/status readable; no cramped desktop-table squeeze.

## 19. Agent Builder integration

No Agent Builder edits. Its existing workspace source count/link and failure state remain intact; unparameterized list compatibility is preserved. Its legacy count fetch still downloads complete records, an existing optimization opportunity outside the new Knowledge page. Agent regression covers its Knowledge-unavailable behavior and existing save/test/assignment flows.

## 20. Live persistence

Unverified. No authenticated disposable live workspace was supplied or established for this run. Controlled browser transport verifies UI create → reload → edit → delete behavior, not a live database. Database credentials alone are not authorization to select or mutate an arbitrary business. No production documents or assistant prompts were modified.

## 21. Retrieval verification

**Knowledge retrieval adoption unverified.** This is a launch blocker. `/voice/chat` sends supplied instructions/history to the model; it does not read Knowledge. `voiceOrchestrator` reads an assistant prompt, not these source records. Its latest-assistant selection also differs from legacy sync's unordered selection. A successful text save or keyword search cannot prove conversational adoption. No paid/provider call was made to manufacture that evidence.

## 22. Remaining launch blockers and risks

- Authenticated live persistence and controlled end-to-end retrieval adoption still require verification.
- Explicit source-to-runtime publication, status/provenance, update/delete propagation and deterministic assistant selection need an approved backend contract before claiming readiness.
- Shared authentication has a pre-existing hardcoded JWT fallback. Require an environment-managed secret and remove the fallback under an authorized authentication hardening task; its value is intentionally not reproduced here.
- Deploy the additive backend reads together with/before this frontend; an old server cannot satisfy the new metadata/detail contract.
- Legacy sync can overwrite an assistant prompt with all source text and offers no context-budget or propagation guarantee. It is not surfaced in the new UI.
- The pre-existing count-then-insert source quota is not concurrency-atomic. No misleading workspace maximum is advertised in the UI.

## 23. TypeScript

`npx tsc --noEmit` passes independently of production build, including after the final focus change.

## 24. ESLint

Targeted Knowledge feature, route and shell lint passes, including after the final focus change. Existing Next configuration skips type/lint inside build; standalone checks are required and were run.

## 25. Tests

Frontend: 11/11 Stage 1 + Stage 5 contract tests pass. Backend: 13/13 Stage 1 + Stage 5 tests pass. Covers tenant-scoped bounded reads, malformed requests, invalid create content, save confirmation, metadata envelopes, failure-vs-empty semantics, explicit delete success, and multibyte request limits.

## 26. Build

Final production build passes for 84 pages, including the focus-wrapping fix.

## 27. Browser QA

Controlled local Chromium tests cover all eleven requested widths: 1440,1366,1280,1100,1024,900,768,430,390,375,360. Knowledge CRUD/reload, lazy details, list/detail retries, retained failures, pending save, empty state, name filtering and pagination pass. Extended keyboard testing found a dialog Tab-wrap issue, fixed with explicit wrapping. Final rerun passes including repeated Tab navigation at all four mobile widths, unsaved Escape cancellation, dialog bounds at 740px height and normal Escape closure. All six screenshots were captured and visually reviewed; the add dialog is captured at 390×844.

Frozen Overview, Conversations and Agents regressions pass. Conversations logs 46 existing out-of-scope shell/browser errors; its scoped assertions pass. This is not a claim that the entire application is console-clean. Knowledge's successful core run had no page errors. Screenshots use controlled QA records, not production customer information.

## 28. Screenshots

Directory: `C:\Startup\bavio-backend\artifacts\stage5\`

- `knowledge-1440.png`
- `knowledge-processing-1440.png` — actual pending save, not indexing
- `knowledge-empty-1440.png`
- `knowledge-390.png`
- `knowledge-add-source-390.png`
- `knowledge-source-detail-1440.png`

## 29. Recommended Stage 6

After visual approval: Leads → Customers, starting with a contract/data audit. Do not introduce customer memory implicitly. Resolve Knowledge's runtime publication and authentication blockers in separately approved backend work before launch. Stage 6 has not started.

## Architecture rationale

UI, dialog lifecycle and transport validation are separated into small typed files. Metadata-only reads and lazy detail keep network usage bounded without breaking older API consumers. Existing indexes support tenant reads; offset paging is adequate for the current small quota. If source volume grows materially, use cursor pagination and a composite tenant/created-at/ID index. No new dependencies, migrations, fake ingestion providers or application business mocks were added; test fixtures exist only in test harnesses.
