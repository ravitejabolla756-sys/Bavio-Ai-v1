# Bavio API Terms

**STATUS: Draft for legal review**  
**Effective date:** `[EFFECTIVE_DATE]`

API users must authenticate with a supported session or API key, keep credentials secret, scope requests to their authorized Workspace, validate input, and obey the [Acceptable Use Policy](ACCEPTABLE-USE-POLICY.md). Do not expose service-role keys or provider secrets in client code.

The customer is responsible for API requests, imported data, webhook endpoints, rate of request, replay protection, and any external effect caused by a configured Action or Workflow. Public rate limits are not yet published. The API surface may change after notice and versioned routes should be used where available.

Customer-facing V1 areas observed in `backend/routes/v1/index.js` include Agents, Calls, Campaigns, Leads/Usage, Webhooks, API keys, Actions reads, and Workflows reads. Internal verification routes and private service calls are not API commitments.

## Legal review required

Confirm API license, rate-limit policy, fair-use, suspension, versioning, availability, security reporting, and liability terms.
