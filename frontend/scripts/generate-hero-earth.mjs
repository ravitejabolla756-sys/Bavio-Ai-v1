/**
 * Deterministic, offline SVG generation. Run: node scripts/generate-hero-earth.mjs
 * Geographic source: Natural Earth 1:110m land, public domain; see data/README.md.
 * No geographic sampling, animation loop, or WebGL is shipped to the browser.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { project, prepareLand, isLand } from './hero-earth-geometry.mjs';

const source = await readFile(new URL('./data/ne_110m_land.geojson', import.meta.url));
const land = prepareLand(JSON.parse(source));
const views = {
  americas: { centerLon: -92, centerLat: 22 },
  atlantic: { centerLon: -35, centerLat: 17 },
  europe: { centerLon: 18, centerLat: 20 },
};
const viewName = process.env.HERO_VIEW || 'americas';
const view = views[viewName] || views.americas;
const groups = ['', '', ''];
const radius = 278;
const cx = 355;
const cy = 355;
let points = 0;

// Near-uniform angular spacing: more longitude separation towards the poles.
for (let lat = -85, row = 0; lat < 85; lat += 0.8, row++) {
  const step = 0.8 / Math.cos(lat * Math.PI / 180);
  for (let lon = -180 + (row % 2) * step / 2; lon < 180; lon += step) {
    const p = project(lon, lat, view.centerLon, view.centerLat);
    if (p.depth <= 0.035 || !isLand(lon, lat, land)) continue;
    const group = p.depth > 0.65 ? 2 : p.depth > 0.3 ? 1 : 0;
    groups[group] += `M${(cx + p.x * radius).toFixed(1)},${(cy + p.y * radius).toFixed(1)}h.01`;
    points++;
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="740" height="740" viewBox="0 0 740 740">
<!-- Generated from Natural Earth land, view=${viewName}. ${points} dots. Source SHA256: ${createHash('sha256').update(source).digest('hex')} -->
<defs>
  <radialGradient id="pearl" cx="62%" cy="44%" r="65%">
    <stop stop-color="#c1bcb5"/><stop offset=".56" stop-color="#cecac5"/>
    <stop offset=".85" stop-color="#e8e5e0"/><stop offset=".97" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/>
  </radialGradient>
  <radialGradient id="halo"><stop offset=".7" stop-color="#d9d1c5" stop-opacity=".27"/><stop offset="1" stop-color="#f6f2ed" stop-opacity="0"/></radialGradient>
  <radialGradient id="rim"><stop offset=".86" stop-color="#fff" stop-opacity="0"/><stop offset=".98" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></radialGradient>
  <radialGradient id="city"><stop stop-color="#fff"/><stop offset=".18" stop-color="#fff9ed"/><stop offset=".4" stop-color="#ffd4a3" stop-opacity=".75"/><stop offset="1" stop-color="#ffd4a3" stop-opacity="0"/></radialGradient>
  <linearGradient id="mist" x1="0" y1="0" x2=".5" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".65"/></linearGradient>
  <clipPath id="sphere"><circle cx="355" cy="355" r="278"/></clipPath>
</defs>
<circle cx="355" cy="365" r="355" fill="url(#halo)"/>
<circle cx="355" cy="355" r="278" fill="url(#pearl)"/>
<g clip-path="url(#sphere)" fill="none" stroke="#fffdfa" stroke-linecap="round">
  ${groups.map((d, i) => `<path d="${d}" stroke-width="${[1.35, 1.6, 1.8][i]}" opacity="${[.65, .85, .97][i]}"/>`).join('\n  ')}
</g>
<circle cx="355" cy="355" r="277" fill="url(#mist)" stroke="#fff" stroke-opacity=".7" stroke-width="1.3"/>
<circle cx="355" cy="355" r="278" fill="url(#rim)"/>
</svg>\n`;
await writeFile(new URL(`../public/images/hero/earth-coded-${viewName}.svg`, import.meta.url), svg);
console.log(`Generated ${viewName} Earth: ${points} land dots, ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB SVG, ${(gzipSync(svg).length / 1024).toFixed(1)} KB gzip.`);
