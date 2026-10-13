<template>
  <div ref="background" class="scroll-atmosphere" aria-hidden="true">
    <div class="scroll-atmosphere__current scroll-atmosphere__current--violet">
      <span class="scroll-atmosphere__ribbon"></span>
    </div>
    <div class="scroll-atmosphere__current scroll-atmosphere__current--pink">
      <span class="scroll-atmosphere__ribbon"></span>
    </div>
    <div class="scroll-atmosphere__current scroll-atmosphere__current--blue">
      <span class="scroll-atmosphere__ribbon"></span>
    </div>
    <div class="scroll-atmosphere__shade"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const background = ref<HTMLElement | null>(null);
const stages = [
  { id: 'home', x: -8, y: -10, turn: -16, violet: 0.76, pink: 0.45, blue: 0.28 },
  { id: 'work-gallery', x: 14, y: 14, turn: 12, violet: 0.58, pink: 0.8, blue: 0.25 },
  { id: 'price-list', x: -12, y: -5, turn: -10, violet: 0.82, pink: 0.35, blue: 0.65 },
  { id: 'availability', x: 10, y: 12, turn: 18, violet: 0.65, pink: 0.72, blue: 0.3 },
  { id: 'contacts', x: -6, y: -12, turn: -6, violet: 0.75, pink: 0.62, blue: 0.45 },
];
let frame = 0;
let resizeObserver: ResizeObserver | undefined;
let motion: MediaQueryList | undefined;
let stops: number[] = [];

function paint(first: (typeof stages)[number], last = first, progress = 0) {
  const style = background.value?.style;
  if (!style) return;
  const mix = (key: 'x' | 'y' | 'turn' | 'violet' | 'pink' | 'blue') =>
    first[key] + (last[key] - first[key]) * progress;
  style.setProperty('--flow-x', `${mix('x').toFixed(2)}vw`);
  style.setProperty('--flow-y', `${mix('y').toFixed(2)}vh`);
  style.setProperty('--flow-turn', `${mix('turn').toFixed(2)}deg`);
  style.setProperty('--violet-strength', mix('violet').toFixed(3));
  style.setProperty('--pink-strength', mix('pink').toFixed(3));
  style.setProperty('--blue-strength', mix('blue').toFixed(3));
}
function update() {
  frame = 0;
  if (document.hidden) return;
  if (motion?.matches || stops.length < 2) {
    paint(stages[0]!);
    return;
  }
  const position = window.scrollY;
  const next = stops.findIndex((stop) => stop > position);
  if (next < 0) {
    paint(stages[stages.length - 1]!);
    return;
  }
  if (next === 0) {
    paint(stages[0]!);
    return;
  }
  const start = stops[next - 1] ?? 0;
  const end = stops[next] ?? start;
  const progress = Math.min(1, Math.max(0, (position - start) / Math.max(1, end - start)));
  paint(stages[next - 1]!, stages[next]!, progress);
}
function scheduleUpdate() {
  if (!frame && !document.hidden && !motion?.matches) frame = window.requestAnimationFrame(update);
}
function measure() {
  const parent = background.value?.parentElement;
  const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  stops = stages.map(({ id }, index) => {
    const section = parent?.querySelector<HTMLElement>(`#${id}`);
    return index === 0
      ? 0
      : Math.min(
          limit,
          Math.max(
            0,
            (section?.getBoundingClientRect().top ?? 0) +
              window.scrollY -
              window.innerHeight * 0.25,
          ),
        );
  });
  if (motion?.matches) paint(stages[0]!);
  else scheduleUpdate();
}
function syncMotion() {
  const paused = document.hidden || Boolean(motion?.matches);
  background.value?.classList.toggle('scroll-atmosphere--paused', paused);
  if (paused && frame) {
    window.cancelAnimationFrame(frame);
    frame = 0;
  }
  if (motion?.matches) paint(stages[0]!);
  else if (!document.hidden) measure();
}
onMounted(() => {
  motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', measure);
  if (background.value?.parentElement) {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(background.value.parentElement);
  }
  syncMotion();
});
onUnmounted(() => {
  window.cancelAnimationFrame(frame);
  window.removeEventListener('scroll', scheduleUpdate);
  window.removeEventListener('resize', measure);
  document.removeEventListener('visibilitychange', syncMotion);
  motion?.removeEventListener('change', syncMotion);
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.scroll-atmosphere {
  --flow-x: -8vw;
  --flow-y: -10vh;
  --flow-turn: -16deg;
  --violet-strength: 0.76;
  --pink-strength: 0.45;
  --blue-strength: 0.28;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  contain: strict;
  background:
    radial-gradient(ellipse at 85% 12%, #301642 0, transparent 58%),
    radial-gradient(ellipse at 5% 100%, #22102f 0, transparent 65%), #100a1b;
}
.scroll-atmosphere__current {
  position: absolute;
  width: 120vmax;
  height: 84vmax;
  pointer-events: none;
  will-change: transform, opacity;
}
.scroll-atmosphere__current--violet {
  top: -54vmax;
  left: -8vmax;
  opacity: var(--violet-strength);
  transform: translate3d(var(--flow-x), var(--flow-y), 0) rotate(var(--flow-turn));
}
.scroll-atmosphere__current--pink {
  right: -58vmax;
  top: -14vmax;
  opacity: var(--pink-strength);
  transform: translate3d(calc(var(--flow-x) * -0.7), calc(var(--flow-y) * -0.8), 0)
    rotate(calc(var(--flow-turn) * -0.8));
}
.scroll-atmosphere__current--blue {
  bottom: -66vmax;
  left: -32vmax;
  opacity: var(--blue-strength);
  transform: translate3d(calc(var(--flow-x) * 0.65), calc(var(--flow-y) * -0.6), 0)
    rotate(calc(var(--flow-turn) * 0.6));
}
.scroll-atmosphere__ribbon {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 35%,
    transparent 31%,
    #57339108 36%,
    #914bdf40 42%,
    #cd89fb70 46%,
    #974be85c 49%,
    #64279c29 54%,
    transparent 62%
  );
  animation: aurora-drift 26s ease-in-out infinite alternate;
}
.scroll-atmosphere__current--pink .scroll-atmosphere__ribbon {
  background: radial-gradient(
    ellipse at 55% 44%,
    transparent 29%,
    #7b296b0a 35%,
    #d743b844 42%,
    #ff9ad879 46%,
    #d955c359 49%,
    #8c348c26 55%,
    transparent 63%
  );
  animation-name: aurora-rise;
  animation-duration: 32s;
  animation-delay: -14s;
}
.scroll-atmosphere__current--blue .scroll-atmosphere__ribbon {
  background: radial-gradient(
    ellipse at 42% 43%,
    transparent 29%,
    #40339108 37%,
    #7565e14a 44%,
    #a599ed61 48%,
    #493ba82e 54%,
    transparent 62%
  );
  animation-duration: 36s;
  animation-delay: -9s;
  animation-direction: alternate-reverse;
}
.scroll-atmosphere__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #100a1b55, transparent 45%, #100a1b0a);
}
.scroll-atmosphere--paused .scroll-atmosphere__ribbon {
  animation-play-state: paused;
}
@keyframes aurora-drift {
  from {
    transform: translate3d(-2%, 1%, 0) rotate(-4deg) scale(0.97, 1.03);
  }
  to {
    transform: translate3d(3%, -2%, 0) rotate(5deg) scale(1.04, 0.96);
  }
}
@keyframes aurora-rise {
  from {
    transform: translate3d(2%, -3%, 0) rotate(6deg) scale(1.02, 0.97);
  }
  to {
    transform: translate3d(-3%, 3%, 0) rotate(-6deg) scale(0.96, 1.05);
  }
}
@media (max-width: 767.98px) {
  .scroll-atmosphere__current {
    width: 100vmax;
    height: 76vmax;
  }
  .scroll-atmosphere__current--violet {
    left: -36vmax;
    top: -38vmax;
  }
  .scroll-atmosphere__current--pink {
    right: -62vmax;
    top: 3vmax;
  }
  .scroll-atmosphere__current--blue {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .scroll-atmosphere__current {
    will-change: auto;
  }
  .scroll-atmosphere__ribbon {
    animation: none;
  }
}
</style>
