<template>
  <div ref="background" class="scroll-atmosphere" aria-hidden="true">
    <div class="scroll-atmosphere__current scroll-atmosphere__current--amber">
      <span class="scroll-atmosphere__ribbon"></span>
    </div>
    <div class="scroll-atmosphere__current scroll-atmosphere__current--copper">
      <span class="scroll-atmosphere__ribbon"></span>
    </div>
    <div class="scroll-atmosphere__current scroll-atmosphere__current--honey">
      <span class="scroll-atmosphere__ribbon"></span>
    </div>
    <div class="scroll-atmosphere__shade"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import {
  atmosphereAt,
  atmosphereStages,
  sectionLayoutTop,
  type AtmosphereStop,
} from '../model/scrollAtmosphere.ts';

const background = ref<HTMLElement | null>(null);
let frame = 0;
let resizeObserver: ResizeObserver | undefined;
let motion: MediaQueryList | undefined;
let stops: AtmosphereStop[] = [];

function paint(state = atmosphereAt(stops, window.scrollY)) {
  const style = background.value?.style;
  if (!style) return;
  style.setProperty('--flow-x', `${state.x.toFixed(2)}vw`);
  style.setProperty('--flow-y', `${state.y.toFixed(2)}lvh`);
  style.setProperty('--flow-turn', `${state.turn.toFixed(2)}deg`);
  style.setProperty('--amber-strength', state.amber.toFixed(3));
  style.setProperty('--copper-strength', state.copper.toFixed(3));
  style.setProperty('--honey-strength', state.honey.toFixed(3));
}
function update() {
  frame = 0;
  if (document.hidden) return;
  paint(motion?.matches ? atmosphereStages[0]! : undefined);
}
function scheduleUpdate() {
  if (!frame && !document.hidden && !motion?.matches) frame = window.requestAnimationFrame(update);
}
function measure() {
  const parent = background.value?.parentElement;
  // The stable large viewport does not change as the phone's address bar hides.
  const height = background.value?.clientHeight || window.innerHeight;
  const limit = Math.max(0, document.documentElement.scrollHeight - height);
  stops = atmosphereStages
    .flatMap((stage, index) => {
      const section = parent?.querySelector<HTMLElement>(`#${stage.id}`);
      if (!section) return [];
      const top =
        index === 0 ? 0 : Math.min(limit, Math.max(0, sectionLayoutTop(section) - height * 0.25));
      return [{ top, stage }];
    })
    .sort((a, b) => a.top - b.top)
    .filter((stop, index, list) => !index || stop.top > list[index - 1]!.top);
  if (motion?.matches) paint(atmosphereStages[0]!);
  else scheduleUpdate();
}
function syncMotion() {
  const paused = document.hidden || Boolean(motion?.matches);
  background.value?.classList.toggle('scroll-atmosphere--paused', paused);
  if (paused && frame) {
    window.cancelAnimationFrame(frame);
    frame = 0;
  }
  if (motion?.matches) paint(atmosphereStages[0]!);
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
  --amber-strength: 0.76;
  --copper-strength: 0.45;
  --honey-strength: 0.28;
  position: fixed;
  inset: 0 0 auto;
  height: 100vh;
  height: 100lvh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  contain: strict;
  background:
    radial-gradient(ellipse at 85% 12%, #493525 0, transparent 58%),
    radial-gradient(ellipse at 5% 100%, #33241b 0, transparent 65%), #231b16;
}
.scroll-atmosphere__current {
  position: absolute;
  width: 120vmax;
  height: 84vmax;
  pointer-events: none;
  will-change: transform, opacity;
}
.scroll-atmosphere__current--amber {
  top: -54vmax;
  left: -8vmax;
  opacity: var(--amber-strength);
  transform: translate3d(var(--flow-x), var(--flow-y), 0) rotate(var(--flow-turn));
}
.scroll-atmosphere__current--copper {
  right: -58vmax;
  top: -14vmax;
  opacity: var(--copper-strength);
  transform: translate3d(calc(var(--flow-x) * -0.7), calc(var(--flow-y) * -0.8), 0)
    rotate(calc(var(--flow-turn) * -0.8));
}
.scroll-atmosphere__current--honey {
  bottom: -66vmax;
  left: -32vmax;
  opacity: var(--honey-strength);
  transform: translate3d(calc(var(--flow-x) * 0.65), calc(var(--flow-y) * -0.6), 0)
    rotate(calc(var(--flow-turn) * 0.6));
}
.scroll-atmosphere__ribbon {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 35%,
    transparent 31%,
    #7f624508 36%,
    #b5957540 42%,
    #d4c2b070 46%,
    #b99a795c 49%,
    #7f624429 54%,
    transparent 62%
  );
  animation: aurora-drift 26s ease-in-out infinite alternate;
}
.scroll-atmosphere__current--copper .scroll-atmosphere__ribbon {
  background: radial-gradient(
    ellipse at 55% 44%,
    transparent 29%,
    #6b52390a 35%,
    #af8d6b44 42%,
    #cbb8a479 46%,
    #b6977859 49%,
    #7d604326 55%,
    transparent 63%
  );
  animation-name: aurora-rise;
  animation-duration: 32s;
  animation-delay: -14s;
}
.scroll-atmosphere__current--honey .scroll-atmosphere__ribbon {
  background: radial-gradient(
    ellipse at 42% 43%,
    transparent 29%,
    #7f624508 37%,
    #bfa3874a 44%,
    #d5c3b161 48%,
    #94724f2e 54%,
    transparent 62%
  );
  animation-duration: 36s;
  animation-delay: -9s;
  animation-direction: alternate-reverse;
}
.scroll-atmosphere__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #231b1655, transparent 45%, #231b160a);
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
  .scroll-atmosphere__current--amber {
    left: -36vmax;
    top: -38vmax;
  }
  .scroll-atmosphere__current--copper {
    right: -62vmax;
    top: 3vmax;
  }
  .scroll-atmosphere__current--honey {
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
