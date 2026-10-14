type Point = { id: number; x: number; y: number };
export function createPhotoGesture() {
  let start: Point | null = null;
  let axis: 'x' | 'y' | null = null;
  return {
    begin(point: Point) {
      start = point;
      axis = null;
    },
    move(point: Point) {
      if (!start || start.id !== point.id) return null;
      const dx = point.x - start.x,
        dy = point.y - start.y;
      if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8)
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      return { dx, dy, axis };
    },
    end(point: Point) {
      const movement = this.move(point);
      start = null;
      axis = null;
      return movement;
    },
    cancel() {
      start = null;
      axis = null;
    },
  };
}
