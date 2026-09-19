# Homepage hero — static visual approval report

Verified locally on 2026-09-14 at http://localhost:5001/.

## Implementation

- Preserved the existing navbar, headline, supporting copy, CTA destinations, and proof-row content.
- Replaced the procedural/WebGL globe treatment with the dedicated transparent asset `frontend/public/images/hero/bavio-pearl-globe.png`: pearl-white glass, warm highlights, and pointillist North/South America detail.
- Added the dedicated transparent-looking silk layer `frontend/public/images/hero/bavio-silk-wave.png` as separate back and front hero layers. The front layer crosses the lower edge of the globe and fills the lower composition.
- Kept only restrained globe-attached orange orbit accents; no full-viewport arcs, labels, procedural dot grid, or dark/neon globe treatment are rendered.
- The composition is intentionally static for founder visual approval. Scroll rotation, orbit animation, and motion polish remain frozen until the static composition is approved.
- The decorative visual is `aria-hidden`; hero copy remains available immediately without entrance delays.

## Verification

- `npm run build`: passed; 97 static pages generated. Homepage output was generated successfully with no dependency or lockfile changes.
- Final asset-based renders captured and visually inspected at desktop and mobile widths; no horizontal overflow observed.
- `artifacts/hero-globe/hero-asset-final-1440.png` is the current desktop approval render.
- `artifacts/hero-globe/hero-asset-match-1280.png` is the current 1280px comparison render.
- `artifacts/hero-globe/hero-asset-final-430.png` is the current mobile render.
- The pre-existing `/api/telephony/supported-countries` proxy certificate error was not changed as part of this visual task.

## Artifacts

All relevant artifacts are in `artifacts/hero-globe/`.

The current approval gate is visual only. No motion-performance claim is made until the founder approves the static composition.

## Limits and follow-up

The existing navigation wraps its sign-in/agent labels at 1024px; that navbar behavior was not changed by the hero work.

Authentication, billing, backend, database, Actions, Workflows, Stage 9, Supabase, and voice runtime were not edited. No commit, push, or deployment was performed.
