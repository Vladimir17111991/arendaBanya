<template>
  <div
    ref="container"
    class="section-navigation d-flex"
    :class="{ 'section-navigation--visible': visible, 'section-navigation--ready': ready }"
    :style="markerStyle"
  >
    <SectionLink
      v-for="link in links"
      :key="link.section"
      :to="link.section"
      class="section-navigation__link d-flex align-items-center justify-content-center fw-medium text-decoration-none"
      :aria-current="activeSection === link.section ? 'location' : undefined"
      @click="emit('follow')"
    >
      {{ link.label }}
    </SectionLink>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { publicSectionLinks as links, type SiteSection } from '../../../shared/routing/index.ts';
import { SectionLink } from '../../../shared/ui/index.ts';

const props = defineProps<{ activeSection?: SiteSection }>();
const emit = defineEmits<{ follow: [] }>();
const container = ref<HTMLElement | null>(null);
const marker = ref({ x: 0, y: 0, width: 0, height: 0 });
const visible = ref(false);
const ready = ref(false);
const markerStyle = computed(() => ({
  '--nav-x': `${marker.value.x}px`,
  '--nav-y': `${marker.value.y}px`,
  '--nav-width': `${marker.value.width}px`,
  '--nav-height': `${marker.value.height}px`,
}));
let observer: ResizeObserver | undefined;
let readyFrame = 0;

function measureMarker() {
  const link = container.value?.querySelector<HTMLElement>('[aria-current="location"]');
  visible.value = !!link;
  if (!link?.offsetHeight) return;
  marker.value = {
    x: link.offsetLeft,
    y: link.offsetTop,
    width: link.offsetWidth,
    height: link.offsetHeight,
  };
  if (!ready.value) {
    window.cancelAnimationFrame(readyFrame);
    readyFrame = window.requestAnimationFrame(() => (ready.value = true));
  }
}
watch(
  () => props.activeSection,
  () => void nextTick(measureMarker),
);
onMounted(() => {
  observer = new ResizeObserver(measureMarker);
  if (container.value) observer.observe(container.value);
  measureMarker();
});
onUnmounted(() => {
  observer?.disconnect();
  window.cancelAnimationFrame(readyFrame);
});
</script>

<style scoped>
.section-navigation {
  position: relative;
  isolation: isolate;
  gap: 4px;
  padding: 5px;
  border: 1px solid #dddcc8;
  border-radius: 100px;
  background: #eeedde80;
}
.section-navigation::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: var(--nav-width);
  height: var(--nav-height);
  transform: translate(var(--nav-x), var(--nav-y));
  border-radius: 100px;
  background: linear-gradient(115deg, #fffdf4, #e0e4cf);
  box-shadow:
    0 3px 10px #4b583314,
    inset 0 1px 0 #fff;
  opacity: 0;
  pointer-events: none;
}
.section-navigation--ready::before {
  transition:
    transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
    width 500ms cubic-bezier(0.22, 1, 0.36, 1),
    height 500ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 320ms ease;
}
.section-navigation--visible::before {
  opacity: 1;
}
.section-navigation__link {
  position: relative;
  min-height: 44px;
  padding: 10px 13px;
  border-radius: 100px;
  color: #646b53;
  font-size: 13px;
  transition: color 320ms ease;
}
.section-navigation__link::after {
  content: '';
  position: absolute;
  inset: 3px;
  z-index: -1;
  border: 1px solid #8b957570;
  border-radius: inherit;
  opacity: 0;
  transform: scale(0.94);
  transition:
    opacity 320ms ease,
    transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
.section-navigation__link:hover,
.section-navigation__link[aria-current='location'] {
  color: #38472f;
}
.section-navigation__link:hover::after,
.section-navigation__link:focus-visible::after {
  opacity: 1;
  transform: scale(1);
}
@media (max-width: 991.98px) {
  .section-navigation {
    width: 100%;
    flex-wrap: wrap;
    border-radius: 18px;
  }
  .section-navigation::before,
  .section-navigation__link {
    border-radius: 13px;
  }
  .section-navigation__link {
    flex: 1 1 calc(50% - 4px);
    min-height: 48px;
    padding-inline: 16px;
    font-size: 13px;
  }
}
@media (min-width: 992px) {
  .section-navigation {
    gap: 8px;
    padding: 6px;
  }
  .section-navigation__link {
    min-width: 124px;
    padding: 12px 24px;
    font-size: 15px;
  }
}
</style>
