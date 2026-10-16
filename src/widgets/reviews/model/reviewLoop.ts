// Keep the visible slide in the middle copy, with room to move in either direction.
export function reviewLoopPosition(position: number, count: number) {
  return count + ((((position - count) % count) + count) % count);
}

export function reviewSwipeTarget(start: number, end: number, width: number, velocity: number) {
  const momentum = Math.max(-0.8, Math.min(0.8, (velocity * 160) / width));
  let target = Math.round(end + momentum);
  const distance = (end - start) * width;
  if (target === Math.round(start) && Math.abs(distance) >= Math.min(48, width * 0.15))
    target += Math.sign(distance);
  return target;
}
