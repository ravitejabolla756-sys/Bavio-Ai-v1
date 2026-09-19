# Stage 4.1 — Agents product polish

The approved `/dashboard/assistant` builder architecture and backend semantics are preserved. Stage 5 has not started.

## Product changes

1. Agents landing: an open list surface with a Your agents heading, actual record count, stronger agent name, readable language, assignment and configuration labels. Updated dates render only when a valid stored timestamp exists. Single-agent layouts include concise navigation guidance without invented metrics.
2. Agent header: name, Voice agent, readable language, and actual phone assignment establish the agent identity. The All agents control is a restrained breadcrumb-style button.
3. Save states: initial state now reads No changes. Unsaved changes, Saving, Saved and Save failed retain existing persistence semantics. Active Save uses #FF6B00 with dark foreground; inactive Save uses a neutral surface instead of pale orange. The button also reads Saving while persistence is pending.
4. Section navigation: grouped blueprint rail with quieter group labels, open hover surfaces, and a narrow orange active marker. No unsupported sections were added.
5. Identity: existing name, greeting and enable controls remain; whitespace separates enablement, with clear copy that phone service is managed separately.
6. Instructions: a defined editor heading, larger padding, comfortable line height, character count and concise guidance. The global unsaved indicator remains authoritative.
7. Knowledge: workspace-level summary and Manage knowledge link retained; no agent-exclusive attachment claim.
8. Voice/language: readable language labels and concise preview guidance. Voice preview receives emphasis in the right rail when Voice is selected.
9. Test rail: current agent identity, section-aware heading, compact explanation of test scope, calm initial response state and explicit Test response label. Only the existing test API is used. Audio errors are separate from message-test errors; missing previews explicitly say Voice preview unavailable.
10. Mobile navigation: native select retained for robust keyboard and touch operation, styled as Agent blueprint navigation with group/section labels.
11. Mobile Save: compact feedback and utility row; neutral when unchanged and orange when edits exist. No permanent sticky overlay was introduced.
12. Responsive behavior: three columns on comfortable desktop widths, two columns and lower test panel at intermediate widths, single active section with dedicated Test navigation on mobile. Textarea height uses viewport units on mobile.

## Files changed

- `frontend/src/features/agents/Agents.tsx`
- `frontend/src/features/agents/AgentFields.tsx`
- `frontend/src/features/agents/TestPanel.tsx`
- `frontend/src/features/agents/presentation.ts`
- `frontend/src/features/agents/agents.module.css`
- `frontend/test-stage4-browser.cjs`

No shared shell, Overview, Conversations, backend or marketing files were modified in this pass. The frontend-design and webapp-testing guidance informed the hierarchy and screenshot review; the installed Puppeteer harness was reused because Python Playwright is unavailable.

## Verification

- TypeScript: passed after the production build completed. An earlier overlapping run encountered transient missing generated Next.js types and was rerun sequentially.
- Targeted ESLint: passed.
- Frontend regression suite: 6/6 passed.
- Backend regression suite: 7/7 passed.
- Production build: passed, 84 pages generated.
- Agents browser QA: passed at 1440, 1366, 1280, 1100, 1024, 900, 768, 430, 390, 375 and 360px. Checks covered document overflow, editor bounds, test-rail collision, unchanged status, save rejection, successful save/reload, phone assignment, test response, optional failures, empty list, creation and unsaved-navigation cancellation.
- Agents landing also checked at 430, 390, 375 and 360px.
- Conversations browser regression: passed, 48 requests. Existing unrelated shell/browser console noise was still reported by that harness.
- Overview browser regression: passed.
- Stage 4 browser checks recorded no page runtime errors. This does not certify every existing console warning across the application.
- All seven requested light-mode screenshots were captured from the production build and visually inspected.

Native labels, section buttons and select navigation, focus indicators, status/error announcements, 44px controls and reduced-motion styling remain in place. Physical-device keyboard behavior was not tested.

## Launch caveats

Live database persistence remains a launch blocker: save/reload tests use controlled HTTP responses, not an authenticated production tenant. Provider audio playback also remains unverified. No generated audio or fabricated provider success was used. The message test checks the existing model endpoint with the editor instructions; it does not certify phone execution or external actions.

## Final screenshots

- [Agents landing — desktop](../artifacts/stage4/agents-list-1440-final.png)
- [Identity — desktop](../artifacts/stage4/agent-builder-identity-1440-final.png)
- [Instructions — desktop](../artifacts/stage4/agent-builder-instructions-1440-final.png)
- [Voice — desktop](../artifacts/stage4/agent-builder-voice-1440-final.png)
- [Test — desktop](../artifacts/stage4/agent-builder-test-1440-final.png)
- [Builder — mobile](../artifacts/stage4/agent-builder-390-final.png)
- [Agents landing — mobile](../artifacts/stage4/agents-list-390-final.png)

Stopped for visual approval. Stage 5 / Knowledge was not started.
