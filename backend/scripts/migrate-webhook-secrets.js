'use strict';

if (process.env.ALLOW_WEBHOOK_SECRET_MIGRATION !== 'true') {
  throw new Error('Refusing webhook secret migration. Set ALLOW_WEBHOOK_SECRET_MIGRATION=true only for an approved isolated/maintenance run.');
}

const db = require('../database/db');
const { migrateLegacyWebhookSecrets } = require('../services/webhookService');

migrateLegacyWebhookSecrets({ database: db, dryRun: process.env.WEBHOOK_SECRET_MIGRATION_DRY_RUN === 'true' })
  .then((result) => {
    console.log('[WEBHOOK SECRET MIGRATION] Completed:', result);
    return db.pool.end();
  })
  .catch(async (error) => {
    console.error('[WEBHOOK SECRET MIGRATION] Failed:', { code: error.code || 'MIGRATION_FAILED' });
    await db.pool.end().catch(() => {});
    process.exitCode = 1;
  });
