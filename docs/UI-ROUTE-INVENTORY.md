# Bavio Authenticated UI Routes

Audit date: 2026-09-15

Local origin: http://localhost:3100

## Scope and safety

This inventory is generated from the frontend App Router and src/config/application-navigation.ts. No production account, production database, production signup, or invented record ID was used. The local frontend currently has no .env* override. Its non-production rewrite now defaults to http://localhost:4000; production still defaults to https://api.bavio.in.

At audit time the frontend was reachable, but the backend listener on port 4000 was not running. All authenticated pages therefore stopped at the existing auth middleware and returned a 307 redirect to /login?redirect=.... They were not classified as empty states.

## Primary routes

| Page | URL | Purpose | Data requirement | Synthetic data exists | Current state | Redesign priority |
|---|---|---|---|---|---|---|
| Overview | http://localhost:3100/workspace | Workspace overview shell used by the canonical navigation | Authenticated workspace/profile | No verified local record | AUTH ERROR: 307 to login | P0 |
| Dashboard overview | http://localhost:3100/dashboard | Existing dashboard overview implementation | Authenticated business/profile and dashboard APIs | No verified local record | AUTH ERROR: 307 to login | P0 |
| Conversations | http://localhost:3100/dashboard/calls | Conversation/call list | Authenticated calls | No verified local record | AUTH ERROR: 307 to login | P0 |
| Conversation detail | http://localhost:3100/dashboard/calls/<REAL_ID> | Single conversation detail | A real call ID belonging to the verification workspace | No ID discovered | BLOCKED: dynamic route exists, no safe ID | P0 |
| Leads | http://localhost:3100/dashboard/leads | Lead list | Authenticated leads | No verified local record | AUTH ERROR: 307 to login | P0 |
| Lead detail | Not present in frontend App Router | No frontend [id] lead page was found | A real lead ID would be required | N/A | MISSING ROUTE | P0 |
| Agents | http://localhost:3100/dashboard/assistant | Agent list/configuration | Authenticated assistants | No verified local record | AUTH ERROR: 307 to login | P0 |
| Agent detail | Not present in frontend App Router | No frontend agent [id] page was found | A real assistant ID would be required | N/A | MISSING ROUTE | P0 |
| Knowledge | http://localhost:3100/dashboard/knowledge | Knowledge base management | Authenticated knowledge documents | No verified local record | AUTH ERROR: 307 to login | P0 |
| Knowledge detail | Not present in frontend App Router | No frontend knowledge [id] page was found | A real document ID would be required | N/A | MISSING ROUTE | P1 |
| Actions | http://localhost:3100/dashboard/actions | Action register | Authenticated actions/webhooks | No verified local record | AUTH ERROR: 307 to login | P0 |
| Action detail | http://localhost:3100/dashboard/actions/<TYPE> | Action-type detail page; dynamic segment is type, not id | Existing action type plus authenticated workspace | No verified record | BLOCKED: dynamic route exists, no verified action type/record | P0 |
| Action execution | http://localhost:3100/dashboard/actions/executions/<REAL_ID> | Action execution evidence | A real execution ID in the verification workspace | No ID discovered | BLOCKED: dynamic route exists, no safe ID | P0 |
| Workflows | http://localhost:3100/dashboard/workflows | Workflow register | Authenticated workflows | No verified local record | AUTH ERROR: 307 to login | P0 |
| Workflow detail | http://localhost:3100/dashboard/workflows/<REAL_ID> | Workflow detail | A real workflow ID in the verification workspace | No ID discovered | BLOCKED: dynamic route exists, no safe ID | P0 |
| Workflow execution | http://localhost:3100/dashboard/workflows/executions/<REAL_ID> | Workflow execution detail | A real execution ID in the verification workspace | No ID discovered | BLOCKED: dynamic route exists, no safe ID | P0 |
| Phone numbers | http://localhost:3100/dashboard/phone-numbers | Phone number management | Authenticated phone number records | No verified local record | AUTH ERROR: 307 to login | P0 |
| Provider connections | http://localhost:3100/dashboard/integrations/voice-pipeline | Voice/provider connections | Authenticated provider connection state | No verified local record | AUTH ERROR: 307 to login | P0 |
| Analytics | http://localhost:3100/dashboard/analytics | Analytics and usage | Authenticated calls/leads/usage | No verified local record | AUTH ERROR: 307 to login | P0 |
| Billing | http://localhost:3100/dashboard/billing | Subscription and billing | Authenticated billing/subscription state | No verified local record | AUTH ERROR: 307 to login | P0 |
| Billing top-ups | http://localhost:3100/dashboard/billing/topups | Top-up billing surface | Authenticated billing state | No verified local record | AUTH ERROR: 307 to login | P1 |
| Settings | http://localhost:3100/dashboard/settings | Account/workspace settings | Authenticated profile/workspace | No verified local record | AUTH ERROR: 307 to login | P0 |

## Additional authenticated workspace routes

| Page | URL | Current state |
|---|---|---|
| Workspace settings | http://localhost:3100/workspace/settings | AUTH ERROR: 307 to login |
| Workspace billing | http://localhost:3100/workspace/billing | AUTH ERROR: 307 to login |
| Workspace subscription | http://localhost:3100/workspace/subscription | AUTH ERROR: 307 to login |
| Workspace demo | http://localhost:3100/workspace/demo | AUTH ERROR: 307 to login |

## Route health evidence

A direct request to each discovered primary route returned HTTP 307 with a Location header preserving the target under /login?redirect=.... This is the expected fail-closed behavior of the current middleware when the bavio_auth=true browser cookie is absent. No route was treated as an empty state or as a successful authenticated page.

## Verified detail IDs

None were found. The verification project is visible, but its database host cannot be resolved from this environment and no safe authenticated session was created, so no UUID was invented and no existing non-verification data was queried.
