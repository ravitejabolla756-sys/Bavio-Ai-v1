# Bavio P0 Stage 2.5 — Conversations visual QA

Date: September 7, 2026. Scope: Conversations visual/interaction QA and polish only. Stage 3 was not started.

## Runtime

- Canonical frontend: `C:\Startup\bavio-backend\frontend`.
- Final QA ran against the rebuilt production app with `BACKEND_URL=http://127.0.0.1:9`; provider/database requests were controlled fixtures and no production secrets were modified.
- The canonical production server started successfully on port 3100.
- The alternate checkout was not touched.

## Routes and viewports inspected

- List: `/dashboard/calls`
- Detail: `/dashboard/calls/call-1`
- Desktop: 1440, 1366, 1280, 1024px.
- Mobile: 430, 390, 375px.
- Search/filter empty state, cursor next-page state, list-to-detail navigation, detail insight unavailable state, no-evidence state and missing-recording state were exercised.

## Findings and fixes

1. The dashboard onboarding checklist/Setup launcher obscured Conversations and triggered unrelated phone/country reads while the page was being inspected. The shell now suppresses that overlay only for Conversations routes and uses a neutral unavailable status indicator there. Other destinations are unchanged.
2. The first visual pass used development mode and showed Next’s red development issue badge. Final QA was rerun against the production build; the dev overlay is absent.
3. The list maintains caller hierarchy, open table rows, restrained status dots, mono IDs/durations, a page-scoped summary, responsive reflow and no horizontal overflow.
4. Filters retain URL state, keyboard focus and a calm filtered-empty state. Pagination remains bounded and explicitly says it is not a business-wide total.
5. Detail composition uses open columns and dividers rather than three nested cards. Mobile switches to Conversation / Details / Activity sections.
6. Missing recording, missing insight, no verified evidence and neutral outcome states read as intentional product states, not failures.
7. The transcript presents speaker/timestamp/text rhythm without chat bubbles or fabricated speaker metadata.

## Browser result

`frontend/test-stage2-browser.cjs` passed:

- all seven list widths;
- filtered-empty state;
- list-to-detail navigation;
- desktop detail layout;
- mobile section controls at 390 and 375px;
- no horizontal overflow;
- no Conversations React exception, hydration warning or key warning;
- expected V1 list/detail request paths captured.

Screenshots:

- [Conversations list — 1440px](C:/Startup/bavio-backend/artifacts/stage2/conversations-list-1440.png)
- [Conversation detail — 1440px](C:/Startup/bavio-backend/artifacts/stage2/conversation-detail-1440.png)
- [Conversations list — 390px](C:/Startup/bavio-backend/artifacts/stage2/conversations-list-390.png)
- [Conversation detail — 390px](C:/Startup/bavio-backend/artifacts/stage2/conversation-detail-390.png)

## Console/network limitations

The shell still produces unrelated 404/500 noise for existing icon conflicts and phone/country endpoints under fixture-only conditions. These requests are outside the Conversations data path and were not changed because Stage 2.5 prohibits unrelated page work. The Conversations-specific browser assertions passed; this is not a claim that the entire application console is clean.

## Final validation

- TypeScript: passed.
- Targeted ESLint for Conversations, Calls and dashboard layout: passed with zero errors/warnings.
- Production build: passed; 84 pages generated, including dynamic `/dashboard/calls/[id]`.
- Backend Stage 1/Stage 2 tests: 7/7 passed.
- Frontend Stage 1 tests: 6/6 passed.
- Browser visual QA: passed against production build.

Stopped after Stage 2.5. No Stage 3 work was started.
