/** Orthographic projection and land containment, used only by the asset generator. */
const radians = Math.PI / 180;

export function project(lon, lat, centerLon = -35, centerLat = 17) {
  const phi = lat * radians;
  const delta = (lon - centerLon) * radians;
  const tilt = centerLat * radians;
  return {
    x: Math.cos(phi) * Math.sin(delta),
    y: -(Math.cos(tilt) * Math.sin(phi) - Math.sin(tilt) * Math.cos(phi) * Math.cos(delta)),
    depth: Math.sin(tilt) * Math.sin(phi) + Math.cos(tilt) * Math.cos(phi) * Math.cos(delta),
  };
}

export function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function prepareLand(collection) {
  return collection.features.flatMap(({ geometry }) => {
    if (!geometry) return [];
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    return polygons.map((rings) => ({
      rings,
      minX: Math.min(...rings[0].map((p) => p[0])),
      maxX: Math.max(...rings[0].map((p) => p[0])),
      minY: Math.min(...rings[0].map((p) => p[1])),
      maxY: Math.max(...rings[0].map((p) => p[1])),
    }));
  });
}

export function isLand(lon, lat, polygons) {
  return polygons.some(({ rings, minX, maxX, minY, maxY }) =>
    lon >= minX && lon <= maxX && lat >= minY && lat <= maxY &&
    inRing(lon, lat, rings[0]) && !rings.slice(1).some((ring) => inRing(lon, lat, ring)));
}
