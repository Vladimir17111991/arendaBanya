/** Wait for native smooth scrolling while allowing a newer selection or user input to cancel it. */
export function scrollToElement(
  target: HTMLElement,
  signal: AbortSignal,
  behavior: ScrollBehavior = 'smooth',
): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  const padding =
    Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const top = Math.max(
    0,
    Math.min(
      target.getBoundingClientRect().top + window.scrollY - padding - margin,
      document.documentElement.scrollHeight - window.innerHeight,
    ),
  );
  if (
    behavior !== 'smooth' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    Math.abs(window.scrollY - top) < 2
  ) {
    window.scrollTo({ top, behavior: 'instant' });
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let frame = 0;
    let settledFrames = 0;
    let lastY = window.scrollY;
    const startedAt = performance.now();
    function finish() {
      window.cancelAnimationFrame(frame);
      signal.removeEventListener('abort', interrupt);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('keydown', onKey);
      resolve();
    }
    function interrupt() {
      window.scrollTo({ top: window.scrollY, behavior: 'instant' });
      finish();
    }
    function onKey(event: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key))
        interrupt();
    }
    function check() {
      const elapsed = performance.now() - startedAt;
      const y = window.scrollY;
      settledFrames = elapsed > 150 && Math.abs(y - lastY) < 0.5 ? settledFrames + 1 : 0;
      lastY = y;
      if (Math.abs(y - top) < 2 || settledFrames > 5 || elapsed > 2500) finish();
      else frame = window.requestAnimationFrame(check);
    }
    signal.addEventListener('abort', interrupt, { once: true });
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', onKey);
    window.scrollTo({ top, behavior: 'smooth' });
    frame = window.requestAnimationFrame(check);
  });
}
