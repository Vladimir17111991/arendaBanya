<template>
  <aside class="gallery-filter" aria-label="Фильтр результатов">
    <div class="gallery-filter__desktop">
      <div class="gallery-filter__heading d-flex align-items-center">
        <svg
          class="gallery-filter__icon flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M4 7h9m4 0h3M4 17h3m4 0h9" stroke-linecap="round" />
          <circle cx="15" cy="7" r="2" />
          <circle cx="9" cy="17" r="2" />
        </svg>
        <h3 id="gallery-categories-title" class="gallery-filter__title m-0 fw-normal">Категории</h3>
      </div>
      <div
        ref="options"
        class="gallery-filter__options d-grid"
        :class="{ 'gallery-filter__options--ready': markerReady }"
        :style="markerStyle"
        role="group"
        aria-labelledby="gallery-categories-title"
      >
        <button
          v-for="item in categories"
          :key="item.id"
          type="button"
          class="gallery-filter__option d-flex align-items-center justify-content-between text-start w-100 fw-medium"
          :class="{ 'gallery-filter__option--selected': selected === item.id }"
          :aria-pressed="selected === item.id"
          :aria-label="item.name"
          @click="selected = item.id"
        >
          <span class="gallery-filter__label">{{ item.name }}</span>
          <span class="gallery-filter__mark d-grid flex-shrink-0" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    <div class="gallery-filter__mobile">
      <label class="gallery-filter__mobile-label" for="results-category">Категория</label>
      <select id="results-category" v-model="selected" class="form-select gallery-filter__select">
        <option v-for="item in categories" :key="item.id" :value="item.id">
          {{ item.name }}
        </option>
      </select>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Category } from '../../../entities/practice/index.ts';
const props = defineProps<{ categories: readonly Category[] }>();
const selected = defineModel<number>({ required: true });
const options = ref<HTMLElement | null>(null);
const marker = ref({ top: 0, height: 0 });
const markerReady = ref(false);
const markerStyle = computed(() => ({
  '--category-top': `${marker.value.top}px`,
  '--category-height': `${marker.value.height}px`,
}));
let observer: ResizeObserver | undefined;
let readyFrame = 0;
function measureMarker() {
  const button = options.value?.querySelector<HTMLElement>('[aria-pressed="true"]');
  if (!button?.offsetHeight) return;
  marker.value = { top: button.offsetTop, height: button.offsetHeight };
  if (!markerReady.value) {
    window.cancelAnimationFrame(readyFrame);
    readyFrame = window.requestAnimationFrame(() => {
      markerReady.value = true;
    });
  }
}
watch(
  [selected, () => props.categories],
  () => {
    void nextTick(measureMarker);
  },
  { deep: true },
);
onMounted(() => {
  observer = new ResizeObserver(measureMarker);
  if (options.value) observer.observe(options.value);
  measureMarker();
});
onUnmounted(() => {
  observer?.disconnect();
  window.cancelAnimationFrame(readyFrame);
});
</script>

<style scoped>
.gallery-filter {
  position: sticky;
  top: 125px;
  max-height: calc(100dvh - 150px);
  overflow-y: auto;
  padding: 22px 14px 14px;
  background: var(--surface-raised);
  border: 1px solid #fffaf6;
  border-radius: 24px;
  box-shadow:
    var(--shadow-raised),
    inset 0 -3px 0 #e8d0d065;
}
.gallery-filter__heading {
  gap: 10px;
  margin: 0 7px 18px;
  padding: 0 3px 18px;
  border-bottom: 1px solid #dbc0cb;
  color: #674052;
}
.gallery-filter__icon {
  width: 22px;
  height: 22px;
}
.gallery-filter__title {
  font-family: var(--display);
  font-size: 23px;
}
.gallery-filter__options {
  position: relative;
  isolation: isolate;
  gap: 9px;
}
.gallery-filter__options::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: var(--category-height, 0px);
  transform: translateY(var(--category-top, 0px));
  border: 1px solid #c8a3b7;
  border-radius: 14px;
  background: linear-gradient(120deg, #efd0d9, #ddc8e3);
  box-shadow:
    0 5px 14px #78475614,
    inset 0 1px 0 #ffffff80;
  pointer-events: none;
}
.gallery-filter__options--ready::before {
  transition:
    transform 460ms cubic-bezier(0.22, 1, 0.36, 1),
    height 360ms ease;
}
.gallery-filter__option {
  position: relative;
  z-index: 1;
  gap: 12px;
  min-height: 52px;
  padding: 13px;
  border: 1px solid #dfc8d080;
  border-radius: 13px;
  background: #fffaf666;
  color: #694653;
  font-size: 15px;
  transition:
    background-color 360ms ease,
    border-color 360ms ease,
    color 360ms ease;
}
.gallery-filter__option:not(.gallery-filter__option--selected):hover {
  color: #4f2e42;
  border-color: #b48b9f;
}
.gallery-filter__label {
  min-width: 0;
  overflow-wrap: anywhere;
}
.gallery-filter__option--selected {
  color: #4f2e42;
  background: transparent;
  border-color: transparent;
}
.gallery-filter__mark {
  place-items: center;
  width: 17px;
  height: 17px;
  border: 1px solid #b89aa8;
  border-radius: 50%;
  transition: border-color 360ms ease;
}
.gallery-filter__mark::after {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #784756;
  opacity: 0;
  transform: scale(0.35);
  transition:
    opacity 280ms ease,
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}
.gallery-filter__option--selected .gallery-filter__mark {
  border-color: #916077;
}
.gallery-filter__option--selected .gallery-filter__mark::after {
  opacity: 1;
  transform: scale(1);
}
.gallery-filter__mobile {
  display: none;
}
@media (max-width: 991.98px) {
  .gallery-filter {
    position: static;
    max-height: none;
    overflow: visible;
    padding: 18px 20px;
    border-radius: 20px;
  }
  .gallery-filter__desktop {
    display: none;
  }
  .gallery-filter__mobile {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .gallery-filter__mobile-label {
    font-size: 15px;
    font-weight: 600;
    color: #674052;
    flex-shrink: 0;
  }
  .gallery-filter__select {
    min-width: 0;
    min-height: 48px;
    background-color: #f6e8ee;
    border-color: #c8a3b7;
    border-radius: 12px;
    font-size: 16px;
    color: var(--ink);
    box-shadow: inset 0 2px 4px #7144590a;
  }
}
@media (max-width: 575.98px) {
  .gallery-filter {
    padding: 15px;
  }
  .gallery-filter__mobile {
    display: block;
  }
  .gallery-filter__mobile-label {
    display: block;
    margin-bottom: 9px;
  }
}
</style>
