import { onUnmounted, ref, watch, type Ref } from 'vue';
import { createLoopCarousel, type EmblaCarouselType } from '../../../shared/lib/carousel/index.ts';

export function useReviewCarousel(
  dialogOpen: Ref<boolean>,
  viewport: Readonly<Ref<HTMLElement | null>>,
) {
  const dragging = ref(false);
  let carousel: EmblaCarouselType | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let motion: MediaQueryList;
  let moving = false;
  let nextAt = 0;
  let lastWheelAt = 0;
  let lastWheelInputAt = 0;
  let wheelDistance = 0;

  function interact() {
    nextAt = Date.now() + 10000;
  }
  function advance(direction: -1 | 1, manual = true) {
    if (!carousel || dragging.value) return;
    if (manual) interact();
    if (direction > 0) carousel.scrollNext(motion.matches);
    else carousel.scrollPrev(motion.matches);
  }
  function onWheel(event: WheelEvent) {
    interact();
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if ((!horizontal && !event.shiftKey) || !carousel) return;
    event.preventDefault();
    const now = Date.now();
    const delta = horizontal ? event.deltaX : event.deltaY;
    if (now - lastWheelInputAt > 180 || Math.sign(delta) !== Math.sign(wheelDistance))
      wheelDistance = 0;
    lastWheelInputAt = now;
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1;
    wheelDistance += delta * scale;
    if (Math.abs(wheelDistance) >= 30 && now - lastWheelAt > 180) {
      advance(wheelDistance > 0 ? 1 : -1);
      wheelDistance = 0;
      lastWheelAt = now;
    }
  }

  watch(
    viewport,
    (element) => {
      clearInterval(timer);
      carousel?.destroy();
      carousel = undefined;
      dragging.value = false;
      moving = false;
      if (!element) return;
      motion = matchMedia('(prefers-reduced-motion: reduce)');
      // Transform looping has no physical scroll edge and accepts a new touch
      // immediately, including while the previous swipe is still settling.
      carousel = createLoopCarousel(element);
      carousel
        .on('pointerDown', () => {
          dragging.value = true;
          interact();
        })
        .on('pointerUp', () => {
          dragging.value = false;
          interact();
        })
        .on('scroll', () => (moving = true))
        .on('settle', () => (moving = false))
        .on('reInit', () => {
          dragging.value = false;
          moving = false;
        });
      nextAt = Date.now() + 5000;
      timer = setInterval(() => {
        const rect = viewport.value?.getBoundingClientRect();
        if (
          motion.matches ||
          dragging.value ||
          moving ||
          dialogOpen.value ||
          document.hidden ||
          viewport.value?.contains(document.activeElement) ||
          !rect ||
          rect.bottom < 0 ||
          rect.top > innerHeight ||
          Date.now() < nextAt
        )
          return;
        advance(1, false);
        nextAt = Date.now() + 5000;
      }, 500);
    },
    { flush: 'post', immediate: true },
  );
  onUnmounted(() => {
    clearInterval(timer);
    carousel?.destroy();
  });
  return { dragging, onWheel, advance, interact };
}
