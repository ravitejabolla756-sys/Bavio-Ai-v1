import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { project, prepareLand, isLand } from './hero-earth-geometry.mjs';

test('projection keeps the center facing the viewer and the antipode hidden', () => {
  const center = project(-35, 17);
  assert.ok(Math.abs(center.x) < 1e-10 && Math.abs(center.y) < 1e-10);
  assert.ok(Math.abs(center.depth - 1) < 1e-10);
  assert.ok(project(145, -17).depth < 0);
});

test('projection stays on a unit sphere', () => {
  for (let lat = -90; lat <= 90; lat += 10) {
    for (let lon = -180; lon <= 180; lon += 10) {
      const { x, y, depth } = project(lon, lat);
      assert.ok(Math.abs(x * x + y * y + depth * depth - 1) < 1e-10);
    }
  }
});

test('land detection respects holes', () => {
  const land = prepareLand({ features: [{ geometry: { type: 'Polygon', coordinates: [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]],
  ] } }] });
  assert.equal(isLand(1, 1, land), true);
  assert.equal(isLand(5, 5, land), false);
  assert.equal(isLand(11, 5, land), false);
});

test('real coastline has land in the Americas and Africa, not the Atlantic', async () => {
  const land = prepareLand(JSON.parse(await readFile(new URL('./data/ne_110m_land.geojson', import.meta.url), 'utf8')));
  for (const [lon, lat] of [[-100, 40], [-50, -10], [20, 5]]) assert.equal(isLand(lon, lat, land), true);
  assert.equal(isLand(-35, 0, land), false);
});
