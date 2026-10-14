<template>
  <Transition name="back-to-top">
    <button
      v-if="visible"
      type="button"
      class="back-to-top position-fixed align-items-center justify-content-center fw-semibold"
      aria-label="Наверх страницы"
      @click="backToTop"
    >
      <svg class="back-to-top__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 11l6-6 6 6M12 5v15"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="back-to-top__label">Наверх</span>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
defineProps<{ mobileHidden?: boolean }>();
const visible = ref(false);
let frame = 0;
function update() {
  frame = 0;
  visible.value = window.scrollY > 600;
}
function onScroll() {
  if (!frame) frame = window.requestAnimationFrame(update);
}
function backToTop() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
  if (window.location.hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
}
onMounted(() => {
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
});
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.cancelAnimationFrame(frame);
});
</script>

<style scoped>
.back-to-top {
  bottom: max(24px, env(safe-area-inset-bottom));
  right: max(24px, env(safe-area-inset-right));
  z-index: 1010;
  display: flex;
  gap: 9px;
  min-height: 56px;
  padding: 14px 20px;
  border: 1px solid #ffebdf80;
  border-radius: 18px;
  color: #fffaf5;
  background: linear-gradient(145deg, #798360, #3d5033);
  box-shadow:
    0 4px 0 #33442c,
    0 12px 28px #27322140,
    inset 0 1px 1px #fff2e960;
  font-size: 13px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.back-to-top__icon {
  width: 22px;
  height: 22px;
}
.back-to-top:hover {
  transform: translateY(-3px);
}
.back-to-top:active {
  transform: translateY(2px);
}
.back-to-top-enter-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.back-to-top-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.back-to-top-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
@media (max-width: 767.98px) {
  .back-to-top--desktop {
    display: none;
  }
  .back-to-top {
    right: max(16px, env(safe-area-inset-right));
    bottom: max(20px, env(safe-area-inset-bottom));
    gap: 0;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    padding: 11px;
    border-radius: 50%;
    box-shadow:
      0 5px 16px #40213330,
      inset 0 1px 1px #fff2e950;
  }
  .back-to-top__label {
    display: none;
  }
  .back-to-top__icon {
    width: 20px;
    height: 20px;
  }
}
</style>
