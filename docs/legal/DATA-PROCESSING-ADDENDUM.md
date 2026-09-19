# Bavio Data Processing Addendum

**STATUS: Draft for legal review**  
**Effective date:** `[EFFECTIVE_DATE]`

This template is intended for a customer that acts as controller/business and Bavio as processor/service provider for configured Customer Content. The correct roles and required clauses depend on the jurisdiction and service.

## Subject matter and duration

Bavio processes account, Workspace, telephony, Conversation, transcript, recording-reference, AI, Lead, Action, Workflow, webhook, and billing-related data to provide the service for the subscription term and any approved post-termination period: `[PROCESSING_DURATION]`.

## Instructions and confidentiality

Bavio processes Customer Content only to provide configured services, maintain security, prevent abuse, troubleshoot, and meet legal obligations. Authorized personnel and subprocessors require confidentiality obligations.

## Security measures

Observed controls include tenant checks, PostgreSQL RLS on selected platform tables, encrypted webhook-secret storage, signed provider callbacks, signed outbound webhooks, HTTPS validation, environment-based secrets, and action/workflow idempotency. These controls are not a certification claim. The complete security schedule requires legal and security review.

## Subprocessors and transfers

Current and optional providers are listed in [Subprocessors](SUBPROCESSORS.md). Processing locations and international transfer mechanisms are `[TRANSFER_MECHANISM]` and `[PRIMARY_HOSTING_REGION]` until confirmed.

## Requests, incidents, deletion, and audit

Bavio will reasonably assist with access, correction, deletion, export, and incident investigation requests subject to the service and law. Incident notification period: `[INCIDENT_NOTIFICATION_PERIOD]`. Return/deletion method and audit cooperation: `[DELETION_AND_AUDIT_TERMS]`.

## Legal review required

Complete controller/processor definitions, data subjects, special-category data, transfer terms, breach notice, audit rights, subprocessor objection, deletion, and liability language.
