import { onMounted, onUnmounted, ref, type Ref } from 'vue';
import { reviewLoopPosition, reviewSwipeTarget } from './reviewLoop.ts';

type Gesture = {
  id: number;
  x: number;
  y: number;
  start: number;
  position: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  axis: 'x' | 'y' | null;
};

export function useReviewCarousel(
  count: number,
  dialogOpen: Ref<boolean>,
  track: Readonly<Ref<HTMLElement | null>>,
) {
  const dragging = ref(false);
  let step = 0;
  let renderedPosition = count;
  let gesture: Gesture | null = null;
  let frame: number | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let wheelTimer: ReturnType<typeof setTimeout> | undefined;
  let touchTimer: ReturnType<typeof setTimeout> | undefined;
  let touching = false;
  let nativeScrolling = false;
  let controlled = false;
  let resizeObserver: ResizeObserver | undefined;
  let motion: MediaQueryList;
  let nextAt = 0;

  function interact() {
    nextAt = Date.now() + 10000;
  }
  function position() {
    return track.value && step ? track.value.scrollLeft / step : count;
  }
  function moveTo(value: number) {
    renderedPosition = value;
    track.value?.scrollTo({ left: value * step, behavior: 'instant' });
  }
  function stopAnimation() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  }
  function controlScroll(value: boolean) {
    controlled = value;
    if (track.value) track.value.style.scrollSnapType = value ? 'none' : '';
  }
  function finishTouchScroll() {
    if (touching || controlled || !nativeScrolling || !step) return;
    clearTimeout(touchTimer);
    touchTimer = undefined;
    nativeScrolling = false;
    // Rebase only after native momentum and snapping have finished.
    moveTo(reviewLoopPosition(Math.round(position()), count));
  }
  function scheduleTouchEnd() {
    clearTimeout(touchTimer);
    // Older mobile browsers do not emit scrollend. Every momentum scroll restarts this timer.
    touchTimer = setTimeout(finishTouchScroll, 220);
  }
  function startTouch() {
    stopAnimation();
    clearTimeout(wheelTimer);
    wheelTimer = undefined;
    clearTimeout(touchTimer);
    const current = position();
    const rebased = reviewLoopPosition(current, count);
    if (step && Math.abs(rebased - current) > 0.001) {
      // A rapid new swipe can interrupt momentum before scrollend. Give it room
      // now, keeping the exact visible offset instead of waiting for idle.
      controlScroll(true);
      moveTo(rebased);
      // Native scrolling continues, but snapping stays off until release so
      // rebasing a partly visible card cannot pull it away from the finger.
      controlled = false;
    } else controlScroll(false);
    touching = true;
    nativeScrolling = true;
    interact();
  }
  function endTouch() {
    touching = false;
    controlScroll(false);
    interact();
    scheduleTouchEnd();
  }
  function onScroll() {
    if (controlled || !nativeScrolling) return;
    renderedPosition = position();
    interact();
    scheduleTouchEnd();
  }
  function settle(target: number) {
    stopAnimation();
    controlScroll(true);
    const from = position();
    if (motion.matches || Math.abs(target - from) < 0.001) {
      moveTo(reviewLoopPosition(target, count));
      controlScroll(false);
      return;
    }
    const started = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - started) / 320);
      moveTo(from + (target - from) * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else {
        frame = undefined;
        moveTo(reviewLoopPosition(target, count));
        controlScroll(false);
      }
    }
    frame = requestAnimationFrame(tick);
  }
  function advance(direction: -1 | 1, manual = true) {
    if (!step || gesture || touching || nativeScrolling) return;
    if (manual) interact();
    stopAnimation();
    clearTimeout(wheelTimer);
    wheelTimer = undefined;
    const current = reviewLoopPosition(position(), count);
    controlScroll(true);
    moveTo(current);
    settle(direction > 0 ? Math.floor(current + 0.001) + 1 : Math.ceil(current - 0.001) - 1);
  }
  function startDrag(event: PointerEvent) {
    // The mouse drag handler must not reset the browser's native finger swipe.
    if (event.pointerType !== 'mouse') return;
    interact();
    if (!event.isPrimary || event.button !== 0 || !step || !track.value) return;
    stopAnimation();
    clearTimeout(wheelTimer);
    wheelTimer = undefined;
    controlScroll(true);
    const start = reviewLoopPosition(position(), count);
    moveTo(start);
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start,
      position: start,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      axis: null,
    };
    track.value.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: PointerEvent) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6)
      gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (gesture.axis !== 'x') return;
    if (event.cancelable) event.preventDefault();
    dragging.value = true;
    const elapsed = event.timeStamp - gesture.lastTime;
    if (elapsed > 0 && event.clientX !== gesture.lastX) {
      gesture.velocity = (gesture.lastX - event.clientX) / elapsed;
      gesture.lastX = event.clientX;
      gesture.lastTime = event.timeStamp;
    }
    gesture.position = gesture.start - dx / step;
    moveTo(reviewLoopPosition(gesture.position, count));
    interact();
  }
  function endDrag(event: PointerEvent) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const finished = gesture;
    gesture = null;
    dragging.value = false;
    if (track.value?.hasPointerCapture(event.pointerId))
      track.value.releasePointerCapture(event.pointerId);
    interact();
    const velocity = event.timeStamp - finished.lastTime < 100 ? finished.velocity : 0;
    const target =
      event.type === 'pointerup' && finished.axis === 'x'
        ? reviewSwipeTarget(finished.start, finished.position, step, velocity)
        : Math.round(finished.position);
    settle(position() + target - finished.position);
  }
  function onWheel(event: WheelEvent) {
    interact();
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if ((!horizontal && !event.shiftKey) || !step || gesture || touching) return;
    event.preventDefault();
    stopAnimation();
    controlScroll(true);
    const delta = horizontal ? event.deltaX : event.deltaY;
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? step : 1;
    moveTo(reviewLoopPosition(position() + (delta * scale) / step, count));
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelTimer = undefined;
      settle(Math.round(position()));
    }, 140);
  }

  onMounted(() => {
    motion = matchMedia('(prefers-reduced-motion: reduce)');
    resizeObserver = new ResizeObserver(() => {
      const element = track.value;
      if (!element) return;
      const nextStep =
        element.children[1]!.getBoundingClientRect().left -
        element.children[0]!.getBoundingClientRect().left;
      if (!nextStep || Math.abs(nextStep - step) < 0.5) return;
      const current = Math.round(renderedPosition);
      stopAnimation();
      gesture = null;
      dragging.value = false;
      step = nextStep;
      nativeScrolling = false;
      touching = false;
      clearTimeout(touchTimer);
      controlScroll(true);
      moveTo(reviewLoopPosition(current, count));
      controlScroll(false);
    });
    if (track.value) resizeObserver.observe(track.value);
    nextAt = Date.now() + 5000;
    timer = setInterval(() => {
      const rect = track.value?.getBoundingClientRect();
      if (
        motion.matches ||
        gesture ||
        touching ||
        nativeScrolling ||
        frame !== undefined ||
        wheelTimer !== undefined ||
        dialogOpen.value ||
        document.hidden ||
        !rect ||
        rect.bottom < 0 ||
        rect.top > innerHeight ||
        Date.now() < nextAt
      )
        return;
      advance(1, false);
      nextAt = Date.now() + 5000;
    }, 500);
  });
  onUnmounted(() => {
    stopAnimation();
    clearInterval(timer);
    clearTimeout(wheelTimer);
    clearTimeout(touchTimer);
    resizeObserver?.disconnect();
  });
  return {
    dragging,
    startDrag,
    moveDrag,
    endDrag,
    startTouch,
    endTouch,
    onScroll,
    finishTouchScroll,
    onWheel,
    advance,
    interact,
  };
}
