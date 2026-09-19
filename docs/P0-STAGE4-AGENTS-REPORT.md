# Stage 4 — Agents / AI Employee Builder

## Route and implementation

The canonical route remains `/dashboard/assistant`, labeled Agents. The existing list/create/configure experience is now split into a route wrapper and a small feature directory. No database, API route, marketing, Overview, or Conversations implementation was changed.

Files delivered:

- `frontend/src/app/dashboard/assistant/page.tsx`
- `frontend/src/features/agents/Agents.tsx` — list, editor state, save and phone assignment orchestration
- `frontend/src/features/agents/AgentFields.tsx` — supported sections and navigation configuration
- `frontend/src/features/agents/TestPanel.tsx` — actual message test and provider audio preview
- `frontend/src/features/agents/service.ts` — typed persisted fields and response verification
- `frontend/src/features/agents/agents.module.css`
- `frontend/src/app/dashboard/layout.tsx` — Agents breadcrumb; exclude Agents from floating setup/checklist fetches and decorative health status
- `frontend/test-stage4-browser.cjs`

Each new application file is below 500 lines. Existing unrelated checkout changes were preserved.

## Supported fields and correctness

The backend controller/service were inspected before implementation. Creation uses `name`, `system_prompt`, `language`, and `voice_id`. Editing also uses `greeting` and `is_active`. The old UI sent `first_message`, `active`, and `model`, which this service did not persist. The new adapter uses the stored fields and verifies the returned record before displaying Saved.

Greeting is editable after creation because the existing create endpoint does not accept it. Clearing a stored greeting is explicitly rejected in the UI because the service uses COALESCE and cannot persist that operation. No schema or backend rewrite was introduced.

## List and builder

The Agents list uses open rows showing actual agent name, stored language, assignment, and configuration completeness. Configured means instructions and a voice are stored; it does not mean healthy, live, or deployed. No sample agents, synthetic performance, or online claims appear.

Desktop has a section rail, central editor, and test panel. Supported navigation is Identity, Instructions, Knowledge, Voice & language, Phone assignment, Voice engine, and Test. The section configuration can accommodate future supported sections without exposing them now.

Identity edits name, greeting, and the stored enable flag. Instructions uses a large labeled editor with character count. Knowledge shows only a workspace source count and a link to existing management; it makes no agent-specific assignment claim.

Voice options come from `/voice/catalog`, with stored voices preserved when absent from the current catalog. English and Hindi use existing runtime language codes; other stored language values remain selectable without coercion. No automatic switching claim is made.

Advanced links to the existing workspace provider/model settings route. The old create-model dropdown was not retained as a persisted feature because the create controller ignored it. No new provider controls or speculative turn-taking settings were added.

## Deployment and test

Phone assignment uses existing link/unlink APIs and refreshes assignments to confirm the result. It is saved separately from configuration. Numbers already assigned elsewhere are excluded. A partial or uncertain failure directs the user to number management, rather than reporting success. These APIs are not transactional; swapping a number can leave the old number unlinked if the next request fails.

The test panel sends the current instructions and a user-entered message to the existing `/voice/chat` endpoint. It shows only the actual returned text, with loading/failure states. This tests the instructions through that endpoint's model, not the agent's full routed voice pipeline, knowledge retrieval, or external actions. Native audio controls use the actual catalog preview URL when present. No generated waveform, success history, or simulated outcomes appear.

## Saving, navigation, and empty states

Loaded, Unsaved changes, Saving, Saved, and Save failed are distinct. Fields are disabled during persistence. A failed save retains edits. Response fields are compared to submitted fields; malformed or unconfirmed persistence does not show Saved.

Dirty drafts trigger browser unload protection and confirmation on clicked navigation links or the All agents control. Clean navigation does not prompt. Browser history traversal inside the app is not fully intercepted by this implementation. Creation requires name, instructions, and a voice in the UI; the empty list offers the real creation flow.

Optional knowledge, voice, and assignment requests fail independently of the agent list. No calls/transcripts are fetched for the builder. Editor changes remain local until explicit Save. Test responses are transient and do not become business evidence.

## Responsive and accessibility

The three-column layout drops the test panel below the editor at 1250px. At 900px and below, a labeled section selector replaces the rail and Test becomes its own view. Required widths were exercised: 1440, 1366, 1280, 1100, 1024, 900, 768, 430, 390, 375, 360. Browser checks assert document width and editor bounds; desktop/mobile screenshots were visually inspected.

Forms use native labels and controls, visible focus outlines, 44px buttons, text status, live save feedback, and reduced-motion rules. No large form dependency was added. The frontend-design skill guided the approved warm palette and restrained section hierarchy; webapp-testing guided screenshot and interaction verification, using installed Puppeteer because Python Playwright is unavailable.

## Validation and limits

- TypeScript: passed.
- Targeted ESLint: passed.
- Production build: passed (84 pages).
- Existing frontend regression tests: 6/6 passed.
- Existing backend regression tests: 7/7 passed; backend unchanged.
- Stage 4 browser harness: passed all 11 widths, rejected save, successful save/reload, assignment, message test, optional errors, empty list, create agent, and unsaved-navigation cancellation.
- Overview and Conversations existing browser harnesses: passed after initial shell integration. Final Agents-only decorative-status adjustment does not alter their branches.
- No page runtime errors were recorded by Stage 4 QA. Existing shell request/console noise in the broader regression harness remains outside this change.
- Persistence and test-response checks used controlled HTTP fixtures. No live tenant credentials or provider-backed call were used; live database persistence and provider audio playback are NOT verified.
- Request limits, assignment atomicity, backend validation, and per-agent full-pipeline tests remain properties of the existing services. This frontend change does not claim to solve them.

## Screenshots

- [Agents list](../artifacts/stage4/agents-list-1440.png)
- [Identity](../artifacts/stage4/agent-builder-identity-1440.png)
- [Instructions](../artifacts/stage4/agent-builder-instructions-1440.png)
- [Voice](../artifacts/stage4/agent-builder-voice-1440.png)
- [Mobile builder](../artifacts/stage4/agent-builder-390.png)

## Next stage

Recommend Stage 5 Knowledge after visual approval, preserving workspace-level provenance and connecting UI controls only to persisted functionality. Stage 5 has not been started.
