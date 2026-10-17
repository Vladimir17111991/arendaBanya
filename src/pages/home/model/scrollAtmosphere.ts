export const atmosphereStages = [
  { id: 'home', x: -8, y: -10, turn: -16, amber: 0.76, copper: 0.45, honey: 0.28 },
  { id: 'work-gallery', x: 14, y: 14, turn: 12, amber: 0.58, copper: 0.8, honey: 0.25 },
  { id: 'price-list', x: -12, y: -5, turn: -10, amber: 0.82, copper: 0.35, honey: 0.65 },
  { id: 'contacts', x: -6, y: -12, turn: -6, amber: 0.75, copper: 0.62, honey: 0.45 },
];

export type AtmosphereStop = { top: number; stage: (typeof atmosphereStages)[number] };

export function atmosphereAt(stops: AtmosphereStop[], position: number) {
  const first = stops[0]?.stage ?? atmosphereStages[0]!;
  const next = stops.findIndex(({ top }) => top > position);
  const start = next < 0 ? (stops.at(-1)?.stage ?? first) : (stops[next - 1]?.stage ?? first);
  const end = next > 0 ? stops[next]!.stage : start;
  const progress =
    next > 0
      ? Math.max(0, (position - stops[next - 1]!.top) / (stops[next]!.top - stops[next - 1]!.top))
      : 0;
  const mix = (key: 'x' | 'y' | 'turn' | 'amber' | 'copper' | 'honey') =>
    start[key] + (end[key] - start[key]) * progress;
  return {
    x: mix('x'),
    y: mix('y'),
    turn: mix('turn'),
    amber: mix('amber'),
    copper: mix('copper'),
    honey: mix('honey'),
  };
}

// Layout offsets exclude the reveal transform, unlike getBoundingClientRect().
export function sectionLayoutTop(element: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = element;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}
