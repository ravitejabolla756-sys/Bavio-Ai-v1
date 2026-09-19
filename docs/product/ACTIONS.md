# Actions

The verified Action types are:

- `bavio.lead.create` — creates a Bavio Lead record with tenant-scoped idempotency and evidence.
- `bavio.webhook.deliver` — sends a configured signed webhook and records delivery/evidence state.

An `ActionExecution` records technical execution state. `ExecutionEvidence` records the available technical result. Evidence does not prove that a business outcome was correct or that a recipient acted on it.

Calendar, CRM, SMS, and other Action types are not documented as implemented here.
