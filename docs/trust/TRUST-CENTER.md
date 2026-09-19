# Bavio Trust Center draft

**Status:** Draft for review; not a certification, audit report, or public promise.

## Security

Bavio uses tenant-scoped application queries, selected PostgreSQL RLS controls, environment-based secrets, encrypted webhook-secret storage, signed provider callbacks, signed outbound webhooks, URL/SSRF protections, and idempotent Action/Workflow execution paths. Coverage varies by legacy route and provider path and requires continued review.

## Privacy and data handling

Bavio processes account, Workspace, telephony, Conversation, AI, Lead, Action, Workflow, webhook, and billing data as described in the [Privacy Policy](../legal/PRIVACY-POLICY.md) and [Data Inventory](DATA-INVENTORY.md). Retention is not one configured global policy.

## Infrastructure and subprocessors

The audited application uses Supabase/PostgreSQL/Storage patterns and provider integrations listed in [Subprocessors](../legal/SUBPROCESSORS.md). Regions and contractual processing terms require confirmation.

## Responsible disclosure and incidents

See [Vulnerability Disclosure](VULNERABILITY-DISCLOSURE.md) and [Incident Response](INCIDENT-RESPONSE.md). Contacts remain placeholders.

## Compliance status

Implemented controls are described in the [Security Control Matrix](SECURITY-CONTROL-MATRIX.md). Formal third-party certifications: None currently claimed. Bavio does not claim that the product is compliant with every jurisdiction or regulated-sector requirement.
