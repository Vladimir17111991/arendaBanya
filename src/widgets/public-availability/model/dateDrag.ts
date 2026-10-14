type Point = { id: number; x: number; y: number };
type Selection = {
  clearSelection(): void;
  selectDate(date: string): void;
  hoverDateAt(date: string): void;
  clearHover(): void;
};

// Pointer capture and hit testing belong to the view; range validation stays in the model.
export function createDateDrag(selection: Selection, now = Date.now) {
  let drag: (Point & { start: string; end: string; moved: boolean }) | null = null;
  let suppressUntil = 0;
  return {
    get active() {
      return drag !== null;
    },
    begin(point: Point, date: string) {
      if (!drag) drag = { ...point, start: date, end: date, moved: false };
    },
    move(point: Point, date: string) {
      if (!drag || drag.id !== point.id) return;
      if (!drag.moved && Math.hypot(point.x - drag.x, point.y - drag.y) < 8) return;
      if (!drag.moved) {
        drag.moved = true;
        selection.clearSelection();
        selection.selectDate(drag.start);
      }
      drag.end = date;
      if (date) selection.hoverDateAt(date);
      else selection.clearHover();
    },
    end(id: number) {
      if (!drag || drag.id !== id) return;
      const current = drag;
      drag = null;
      suppressUntil = now() + 500;
      if (!current.moved) selection.selectDate(current.start);
      else {
        if (current.end && current.end !== current.start) selection.selectDate(current.end);
        selection.clearHover();
      }
    },
    cancel() {
      if (drag?.moved) {
        selection.clearSelection();
        suppressUntil = now() + 500;
      }
      drag = null;
    },
    ignoreClick(detail: number) {
      return detail > 0 && now() < suppressUntil;
    },
  };
}
