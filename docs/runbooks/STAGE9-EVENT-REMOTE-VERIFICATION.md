# Stage 9.0.1 isolated event verification

Target only `bavio-verification` (`qninimnubfjmyriafdgj`). Production Bavio.ai is prohibited.

1. Apply `supabase/verification/stage9-event-migration.sql` in the isolated SQL session.
2. Run `stage9-event-audit.sql` and confirm both tables, unique logical-event index, and RLS.
3. Use only synthetic Tenant A/B and canonical calls fixtures. Do not insert `business_events` directly for the behavioral test; invoke the backend `recordConversationCompletedEvent` adapter.
4. Verify normal, duplicate, concurrent, unknown, ambiguous, cross-tenant, reconciliation, and immutable-payload cases.
5. Configure an explicit tenant-owned `workflow_automation_bindings` row only for configuration tests. Store only the webhook UUID; never copy a secret.
6. Confirm no `workflow_executions`, `trigger_executions`, Lead, or webhook delivery is created by Stage 9.0.1.
7. Run `stage9-event-audit.sql` again and retain the output as evidence.

The current repository cannot claim remote verification until these SQL files are actually run against the isolated project. This stage does not start trigger processing.
