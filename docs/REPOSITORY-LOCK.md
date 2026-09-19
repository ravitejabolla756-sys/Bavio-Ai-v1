# Bavio canonical working repository

Owner designation received September 7, 2026:

- Repository: `C:\Startup\bavio-backend`
- Frontend: `C:\Startup\bavio-backend\frontend`
- Backend: `C:\Startup\bavio-backend\backend`
- Branch at designation: `main`
- HEAD: `934b58290662115b1c3ba2aeb326fe297ca0a0b7`

This is a working-repository lock, not evidence of which checkout deployed production. Both checkouts have the same GitHub remote and deployment configuration; neither has a local Vercel project link. Authenticated deployment inspection was unavailable. The owner explicitly selected this checkout after those findings were presented.

The alternate `C:\Startup\bavio-frontend` remains untouched. Do not merge or copy its source tree wholesale. See `C:\Startup\BAVIO-P0-STAGE1-PREFLIGHT.md` for the comparison and individually listed candidate integrations.

## Safety

Pre-change source and Git state are archived at `C:\Startup\bavio-safety-20260907-stage1\canonical-before.tar.gz`.

SHA-256: `30031BB2F7FD10C49CAFABD91011F4284D6E275274C90D32B4B48AE914416271`

The archive includes ignored environment files and must remain private. Do not upload it, commit it, or display its contents. Generated dependencies, Next build output and TypeScript incremental caches were excluded. Verify recovery into a separate directory; never extract over the working tree without owner approval. This is not a database or external-service backup.

No checkpoint commit was appropriate because pre-existing work was mixed. No commit, push, reset, clean, checkout overwrite, source deletion or database migration was performed during Stage 1.
