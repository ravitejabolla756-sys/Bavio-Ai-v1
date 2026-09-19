# Webhook Secret Migration Runbook

This runbook is for an approved maintenance window only. It is not executed automatically by application startup.

## Preconditions

- Confirm the target database is an isolated test database or an explicitly approved production maintenance target.
- Confirm no customer webhook delivery is being used for validation.
- Confirm the database backup/restore point is available and tested.
- Provision `WEBHOOK_SECRET_ENCRYPTION_KEY` as a stable 32-byte base64 value or 64-character hex value through the deployment secret manager.
- Do not put the key in source control, `.env.example`, logs, or migration output.

## Dry run

From `C:\Startup\bavio-backend\backend`, with the approved database environment loaded:

```powershell
$env:ALLOW_WEBHOOK_SECRET_MIGRATION = 'true'
$env:WEBHOOK_SECRET_MIGRATION_DRY_RUN = 'true'
node scripts/migrate-webhook-secrets.js
```

Review the candidate count and IDs. Do not proceed if the target is not the intended environment.

## Execute

Unset `WEBHOOK_SECRET_MIGRATION_DRY_RUN`, keep the same stable key, and run:

```powershell
$env:WEBHOOK_SECRET_MIGRATION_DRY_RUN = 'false'
node scripts/migrate-webhook-secrets.js
```

The script encrypts each legacy value with AES-256-GCM, writes `signing_secret_encrypted` and `signing_secret_version`, then clears the legacy plaintext column using an explicit `signing_secret_encrypted IS NULL` guard.

## Post-migration verification

- Confirm the migrated count matches the reviewed dry-run count.
- Confirm no intended row has a non-null legacy `signing_secret`.
- Confirm `signing_secret_encrypted` and `signing_secret_version` are populated.
- Confirm a synthetic controlled webhook can be signed and delivered.
- Confirm API responses, ActionExecution, ExecutionEvidence, and logs contain no secret material.
- Run the migration a second time; it should find zero candidates.

## Rollback and incident guidance

Do not restore plaintext secrets into the application table as a normal rollback. If decryption fails, stop webhook delivery, preserve the encrypted value and key/version evidence, and restore the database from the approved backup only after incident review. Never rotate or discard the old key until all rows using its version have been re-encrypted and verified.

# Key rotation status

The current implementation has explicit `signing_secret_version` metadata and rejects unsupported versions, but only `v1` is implemented. Future rotation should add `v2` key resolution, keep `v1` readable, write new values as `v2`, run an explicit re-encryption migration, verify zero `v1` rows, and retire the old key only afterward.
