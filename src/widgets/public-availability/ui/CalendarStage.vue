<template>
  <div
    ref="scene"
    class="calendar-stage"
    :class="{ 'calendar-stage--backward': direction < 0 }"
    @pointermove="moveLight"
    @pointerleave="resetLight"
    @focusin="onFocus"
  >
    <div class="calendar-stage__halo" aria-hidden="true"></div>
    <div ref="panel" class="calendar-stage__panel">
      <div class="calendar-stage__rim" aria-hidden="true"></div>
      <div class="calendar-stage__header"><slot name="header" /></div>
      <div :key="month" class="calendar-stage__page"><slot /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{ month: string; direction: number }>();
const scene = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
let pointer: MediaQueryList | undefined;
let motion: MediaQueryList | undefined;
let frame = 0;
let x = 0.5;
let y = 0.5;
let tilt = false;

function paint() {
  frame = 0;
  const style = panel.value?.style;
  if (!style) return;
  style.setProperty('--light-x', `${x * 100}%`);
  style.setProperty('--light-y', `${y * 100}%`);
  // Hold the panel still over date buttons so targets never move under a click.
  if (tilt) {
    style.setProperty('--tilt-x', `${(0.5 - y) * 5 + 3}deg`);
    style.setProperty('--tilt-y', `${(x - 0.5) * 5}deg`);
  }
}

function moveLight(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || !pointer?.matches || motion?.matches) return;
  const bounds = scene.value?.getBoundingClientRect();
  if (!bounds?.width || !bounds.height) return;
  x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
  y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
  tilt = !(event.target instanceof Element && event.target.closest('button'));
  if (!frame) frame = window.requestAnimationFrame(paint);
}

function resetLight() {
  window.cancelAnimationFrame(frame);
  frame = 0;
  panel.value?.removeAttribute('style');
}

function syncPreferences() {
  resetLight();
}
function onFocus(event: FocusEvent) {
  if (event.target instanceof Element && event.target.matches(':focus-visible')) resetLight();
}

onMounted(() => {
  pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  pointer.addEventListener('change', syncPreferences);
  motion.addEventListener('change', syncPreferences);
});
onUnmounted(() => {
  window.cancelAnimationFrame(frame);
  pointer?.removeEventListener('change', syncPreferences);
  motion?.removeEventListener('change', syncPreferences);
});
</script>

<style scoped>
.calendar-stage {
  position: relative;
  margin: 34px 0 28px;
  perspective: 1300px;
  perspective-origin: 50% 35%;
}
.calendar-stage__halo {
  position: absolute;
  inset: 0 -8px -30px;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 85% 25%, #ec57c333, transparent 60%),
    radial-gradient(ellipse at 20% 85%, #9444ed3d, transparent 62%);
  filter: blur(22px);
  pointer-events: none;
}
.calendar-stage__panel {
  --tilt-x: 3deg;
  --tilt-y: -1.5deg;
  --light-x: 75%;
  --light-y: 10%;
  position: relative;
  padding: 24px 18px 22px;
  border: 1px solid #bf8fda85;
  border-radius: 26px;
  background:
    radial-gradient(ellipse at var(--light-x) var(--light-y), #d66deb24, transparent 65%),
    linear-gradient(150deg, #38204e, #21132f 55%, #291535);
  box-shadow:
    inset 0 1px 0 #ffe2ff70,
    inset 1px 0 0 #f9d8ff20,
    0 9px 0 #160c20,
    0 10px 0 #87519f,
    0 16px 0 -3px #11091b,
    0 32px 44px -12px #05010cbb,
    0 0 36px #bd49e91c;
  transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  transform-style: preserve-3d;
  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);
}
.calendar-stage__rim {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border-top: 2px solid #f4acfa8a;
  border-right: 1px solid #e58ac580;
  pointer-events: none;
  transform: translateZ(1px);
}
.calendar-stage__header {
  position: relative;
  padding-bottom: 20px;
  margin-bottom: 18px;
  border-bottom: 1px solid #c08ae333;
  transform: translateZ(14px);
}
.calendar-stage__header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 18%;
  right: 18%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #f7b3f7, transparent);
  box-shadow: 0 0 12px #ee78e8aa;
}
.calendar-stage__page {
  transform-style: preserve-3d;
  animation: calendar-forward 460ms cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: 50% 0;
}
.calendar-stage--backward .calendar-stage__page {
  animation-name: calendar-backward;
}
@keyframes calendar-forward {
  from {
    opacity: 0;
    transform: rotateX(-12deg) translate3d(0, 12px, 18px);
  }
  to {
    opacity: 1;
    transform: rotateX(0) translate3d(0, 0, 0);
  }
}
@keyframes calendar-backward {
  from {
    opacity: 0;
    transform: rotateX(12deg) translate3d(0, -8px, -10px);
  }
  to {
    opacity: 1;
    transform: rotateX(0) translate3d(0, 0, 0);
  }
}
@media (hover: none), (pointer: coarse) {
  .calendar-stage__panel {
    transform: none;
  }
}
.calendar-stage__panel:has(:focus-visible) {
  transform: none;
}
@media (max-width: 575.98px) {
  .calendar-stage {
    margin-top: 26px;
    margin-inline: -4px;
  }
  .calendar-stage__panel {
    padding: 20px 8px 18px;
    border-radius: 20px;
    transform: none;
  }
  .calendar-stage__header {
    padding-bottom: 16px;
    margin-bottom: 14px;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .calendar-stage__panel,
  .calendar-stage__header {
    transform: none;
    transition: none;
  }
  .calendar-stage__page {
    animation: none;
  }
}
</style>
