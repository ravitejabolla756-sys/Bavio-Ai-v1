# Bavio P0 Stage 2 — Conversations UX

Implementation status: complete locally, pending visual browser verification. Scope stayed inside `C:\Startup\bavio-backend`; the alternate checkout and unrelated application/marketing surfaces were not intentionally changed.

## Route behavior

- Existing list route remains `/dashboard/calls`; the application label is Conversations.
- Deep-linked detail route is `/dashboard/calls/[id]`.
- The frontend reads the existing authenticated V1 contract at `/api/v1/calls` and `/api/v1/calls/:id`, while backend storage/API naming remains calls.
- Detail links preserve a sanitized list-query return path. Unknown query keys are discarded.

## Data and API work

- Added a bounded, parameterized keyset read query in `backend/services/conversationReadQuery.js`.
- Added tenant-scoped list/detail handlers in `backend/controllers/v1/conversationReads.js` and wired them through the existing V1 controller exports.
- List requests are capped at 25 in the UI and 100 at the query boundary. Supported filters are status, agent, caller/ID search, start date and cursor.
- Tenant predicates apply to the base row and agent join. Status is normalized from existing call status fields. Cursor pagination handles timestamp ties with record ID ordering.
- Detail reads expose existing caller, assistant, state, duration, timestamps, transcript, recording URL and processing state. No new tables or migrations were introduced.

## UX implementation

- Replaced the previous Calls screen with a calm operations list: page-scoped summary, status/agent/date/search filters, open table rows, bounded pagination, and explicit current-page labeling.
- List columns: caller, agent, state, started, duration, and open affordance. No fake intent/result columns are shown without a detail contract.
- Added a deep inspector with context, real recording controls, transcript, understanding, activity/evidence, and outcome sections.
- Insight text is labeled as inferred conversation understanding. Legacy or absent insight provenance remains visibly unverified/unavailable.
- Activity and Outcome never manufacture actions. With the current API, the page says “No verified business actions were recorded” and “No verified external outcome recorded.”
- Recording uses native playback against the verified URL only. Missing, processing, expired and playback-error states are explicit.
- Transcript preserves raw text and structured speaker/timestamp data without inventing missing speakers or timestamps. Long transcripts paginate at 40 turns per view.
- Mobile uses Conversation / Details / Activity segmented sections rather than squeezing three desktop columns into a phone layout.
- The shared dashboard shell remains in place. The onboarding checklist no longer fetches conversation history on Conversations routes, avoiding an unbounded background read.

## Accessibility and performance

- Semantic table, caption, headings, `aria-current`, `aria-pressed`, labeled controls, visible focus outlines, status text plus indicators, native audio controls, retry feedback and keyboard-operable navigation are included.
- Mobile controls are at least 44px tall. No horizontal table overflow is used on mobile; rows reflow into labeled records.
- Transcript entries use `content-visibility` with intrinsic sizing. Reads use `AbortController` and identity guards to avoid stale detail/list updates.
- No autoplay, fake waveform, semantic transcript search, future channel filters, or unsupported actions were added.
- Reduced-motion CSS disables transitions/animations in this feature.

## Files added or changed for Stage 2

Added:

- `backend/services/conversationReadQuery.js`
- `backend/controllers/v1/conversationReads.js`
- `frontend/src/app/dashboard/calls/[id]/page.tsx`
- `frontend/src/features/conversations/ConversationList.tsx`
- `frontend/src/features/conversations/ConversationDetail.tsx`
- `frontend/src/features/conversations/service.ts`
- `frontend/src/features/conversations/presentation.ts`
- `frontend/src/features/conversations/useRead.ts`
- `frontend/src/features/conversations/conversations.module.css`
- `frontend/src/features/conversations/components/ReadFeedback.tsx`
- `frontend/src/features/conversations/components/Status.tsx`
- `frontend/src/features/conversations/components/ConversationAudio.tsx`
- `frontend/src/features/conversations/components/Transcript.tsx`
- `frontend/src/features/conversations/components/Understanding.tsx`
- `frontend/src/features/conversations/components/Evidence.tsx`

Modified:

- `backend/controllers/v1/callsV1Controller.js`
- `frontend/src/app/dashboard/calls/page.tsx`
- `frontend/src/app/dashboard/layout.tsx`
- `frontend/src/components/ApplicationNavigation.tsx`
- `frontend/src/lib/api-transport.ts`
- `frontend/test-stage1-browser.cjs` fixture routing
- `backend/test-stage1.cjs` bounded query coverage

## Validation

- TypeScript: passed with `npx tsc --noEmit --incremental false`.
- Production build: passed; Next.js generated the new dynamic `/dashboard/calls/[id]` route and all 84 pages.
- Targeted ESLint for Conversations, Calls, and dashboard layout: passed with zero errors/warnings.
- Backend Stage 1 plus Stage 2 query tests: 7/7 passed.
- Frontend Stage 1 adapter/API tests: 6/6 passed.
- Backend syntax checks: passed.
- Browser runtime/visual verification: pending. Starting the local server/browser verification was blocked by the environment usage-limit approval gate; no runtime pass is claimed for this Stage 2 implementation.

## Known limitations

- Existing backend outcome reads expose interpretation data but no verified execution-evidence collection, so the evidence panel correctly remains empty.
- Existing list data does not provide reliable business-wide counts; the summary is explicitly page-scoped.
- Agent filter options reflect the current page because no separate agent query was added to this slice.
- The search is caller number or conversation ID only. It is not transcript search.
- Full repository lint still has pre-existing marketing JSX errors and was not broadened into this stage.
- Production authentication, real database pagination, recordings, and provider receipts require an authenticated environment; none were fabricated.

## Stage 3 recommendation

Stop here for owner visual review of Conversations. The next authorized slice should add evidence-backed action receipts only after their source systems and ownership model are specified. Do not propagate this design to Overview or Agents until the Conversations screen is visually approved and exercised against real authenticated data.
