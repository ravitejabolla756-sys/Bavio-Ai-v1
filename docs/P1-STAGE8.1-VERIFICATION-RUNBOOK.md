# Stage 8.1 Verification Runbook

Target only: Supabase project `bavio-verification`, reference `qninimnubfjmyriafdgj`.
Production Bavio.ai is off limits.

1. Confirm the active SQL editor/project reference is exactly `qninimnubfjmyriafdgj`.
2. Apply `supabase/verification/stage8-workflow-migration.sql` using the existing Stage 7 operator connection.
3. Run `supabase/verification/stage8-workflow-audit.sql` and confirm all five tables exist with RLS enabled, the expected constraints/indexes are present, and runtime counts are zero.
4. Run `supabase/verification/stage8-workflow-seed.sql`.
5. Run `supabase/verification/stage8-workflow-audit.sql` again and confirm both verification tenants have exactly version 1 with positions 1 and 2, with no runtime or action/evidence rows created by the seed.
6. Run the local Stage 8.1 test suite before any real runtime invocation.
7. Configure a controlled tenant-owned HTTPS receiver using the existing Stage 7 verification procedure; do not use a production endpoint.
8. Run the real success, Step 1 failure, Step 2 failure, duplicate, concurrent duplicate, cross-tenant, crash/resume, failed replay, and webhook no-resend recovery matrices.
9. Record actual WorkflowExecution, WorkflowStepExecution, ActionExecution, and ExecutionEvidence rows. Do not claim real persistence until the SQL and runtime invocation have actually run against the target project.
10. Do not run any command against Bavio.ai, and do not add a public workflow run endpoint or UI.
