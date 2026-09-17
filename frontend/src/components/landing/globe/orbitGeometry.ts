export interface Orbit {
  label: string;
  angle: number;
  radius: number;
  depth: number;
  period: number;
  phase: number;
}

export const ORBITS: readonly Orbit[] = [
  { label: "Call", angle: -22, radius: 263, depth: 82, period: 23, phase: 0.8 },
  { label: "Lead", angle: 38, radius: 258, depth: 104, period: 29, phase: 2.6 },
  { label: "Workflow", angle: -61, radius: 251, depth: 92, period: 31, phase: 4.7 },
  { label: "Webhook", angle: 12, radius: 277, depth: 122, period: 19, phase: 3.5 },
];

/** Project an inclined circular orbit into SVG space; z carries front/rear depth. */
export function orbitPoint(orbit: Orbit, phase: number) {
  const tilt = orbit.angle * Math.PI / 180;
  const x = orbit.radius * Math.cos(phase);
  const y = orbit.depth * Math.sin(phase);
  return {
    x: 320 + x * Math.cos(tilt) - y * Math.sin(tilt),
    y: 320 + x * Math.sin(tilt) + y * Math.cos(tilt),
    z: Math.sin(phase),
  };
}

export function orbitPath(orbit: Orbit, rear: boolean) {
  return Array.from({ length: 65 }, (_, i) => {
    const point = orbitPoint(orbit, (rear ? Math.PI : 0) + i / 64 * Math.PI);
    return `${i ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }).join(" ");
}
