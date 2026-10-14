<template>
  <section
    id="work-gallery"
    class="work-gallery content-section"
    tabindex="-1"
    aria-labelledby="works-title"
  >
    <div class="container">
      <div class="section-heading row gy-3">
        <div class="col-12">
          <h2 id="works-title" class="section-heading__title">
            Загляните <em class="section-heading__accent">в нашу баню.</em>
          </h2>
        </div>
        <div class="col-12">
          <p class="section-heading__intro">
            Баня, спальня и детали пространства — фотографии помогут представить ваш отдых.
          </p>
        </div>
      </div>

      <div v-if="galleryPhotos.length" class="work-gallery__toolbar">
        <div class="work-gallery__filters" role="group" aria-label="Выбор фотографий">
          <button
            v-for="filter in filters"
            :key="filter.id"
            type="button"
            class="work-gallery__filter"
            :aria-pressed="activeFilter === filter.id"
            aria-controls="gallery-photo-grid"
            @click="activeFilter = filter.id"
          >
            {{ filter.label }} <span class="work-gallery__filter-count">{{ filter.count }}</span>
          </button>
        </div>
        <p class="work-gallery__count">
          Показано {{ visiblePhotos.length }} из {{ filteredPhotos.length }} фото
        </p>
      </div>
      <div
        v-if="galleryPhotos.length"
        id="gallery-photo-grid"
        ref="content"
        class="work-gallery__grid"
      >
        <figure
          v-for="(photo, index) in visiblePhotos"
          :key="photo.id"
          class="work-gallery__photo"
          :class="{ 'work-gallery__photo--main': index === 0 }"
          tabindex="-1"
        >
          <button
            type="button"
            class="work-gallery__preview"
            :aria-label="'Рассмотреть: ' + photo.title"
            @click="openPhoto(photo.id)"
          >
            <img
              :src="photo.url"
              :alt="photo.title"
              class="work-gallery__image"
              :style="{ objectPosition: photo.objectPosition }"
              loading="lazy"
              decoding="async"
            />
          </button>
          <figcaption class="work-gallery__caption">{{ photo.title }}</figcaption>
        </figure>
      </div>
      <div v-else class="gallery-empty">
        <div class="gallery-empty__collage" aria-hidden="true">
          <div class="gallery-empty__frame gallery-empty__frame--main">
            <span class="gallery-empty__arch"></span>
            <span class="gallery-empty__frame-label">БАНЯ</span>
          </div>
          <div class="gallery-empty__frame gallery-empty__frame--bedroom">
            <span class="gallery-empty__frame-label">СПАЛЬНЯ</span>
          </div>
          <div class="gallery-empty__frame gallery-empty__frame--detail">
            <span class="gallery-empty__frame-label">ДЕТАЛИ</span>
          </div>
        </div>
        <div class="gallery-empty__copy">
          <p class="section-heading__kicker">ФОТОГРАФИИ ГОТОВЯТСЯ</p>
          <h3 class="gallery-empty__title">Скоро здесь будет<br /><em>само место.</em></h3>
          <p class="gallery-empty__text">
            Виктория добавит фотографии бани и спальни. Пока можно посмотреть свободные даты и
            обсудить отдых по телефону.
          </p>
        </div>
      </div>
      <div v-if="galleryPhotos.length" class="work-gallery__more">
        <button
          v-if="hasMore"
          type="button"
          class="btn btn-outline-primary"
          aria-controls="gallery-photo-grid"
          @click="showMore"
        >
          Ещё фотографии <span aria-hidden="true">↓</span>
        </button>
      </div>
      <p class="visually-hidden" role="status">{{ announcement }}</p>
    </div>
    <MediaDialog
      class="work-gallery__dialog"
      :class="{
        'work-gallery__dialog--closing': closing,
        'work-gallery__dialog--swipe-close': swipeClose,
      }"
      :open="!!selectedPhoto"
      :title="selectedPhoto?.title ?? 'Просмотр фото'"
      @close="closePhoto()"
      @keydown="onDialogKeydown"
    >
      <div
        ref="swiper"
        class="photo-swiper"
        role="region"
        aria-label="Фотографии бани — листайте влево или вправо"
        tabindex="0"
        @scroll="onSwipe"
        @pointerdown="startGesture"
        @pointermove="moveGesture"
        @pointerup="endGesture"
        @pointercancel="cancelGesture"
        @lostpointercapture="gesture.cancel()"
      >
        <div v-for="photo in filteredPhotos" :key="photo.id" class="photo-swiper__slide">
          <img :src="photo.url" :alt="photo.title" draggable="false" class="photo-swiper__image" />
        </div>
      </div>
    </MediaDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { usePractice } from '../../../entities/practice/index.ts';
import { MediaDialog } from '../../../shared/ui/index.ts';
import { createPhotoGesture } from '../model/photoGesture.ts';

type PhotoFilter = 'all' | 'bath' | 'bedroom';
const { photos, siteImages, services } = usePractice();
const content = ref<HTMLElement | null>(null);
const swiper = ref<HTMLElement | null>(null);
const gesture = createPhotoGesture();
let startScroll = 0;
let startIndex = 0;
function point(event: PointerEvent) {
  return { id: event.pointerId, x: event.clientX, y: event.clientY };
}
function startGesture(event: PointerEvent) {
  const element = swiper.value;
  if (!element || closing.value) return;
  if (!event.isPrimary) {
    cancelGesture();
    return;
  }
  if (event.button !== 0) return;
  // Stop an unfinished slide animation so the next gesture acts immediately.
  startScroll = element.scrollLeft;
  startIndex = Math.round(startScroll / element.clientWidth);
  element.scrollTo({ left: startScroll, behavior: 'instant' });
  gesture.begin(point(event));
  element.setPointerCapture(event.pointerId);
}
function moveGesture(event: PointerEvent) {
  const movement = gesture.move(point(event));
  if (movement?.axis === 'x' && swiper.value) swiper.value.scrollLeft = startScroll - movement.dx;
}
function settlePhoto(index: number) {
  const element = swiper.value;
  if (!element) return;
  element.scrollTo({
    left: Math.max(0, Math.min(filteredPhotos.value.length - 1, index)) * element.clientWidth,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}
function endGesture(event: PointerEvent) {
  const movement = gesture.end(point(event));
  if (!movement) return;
  if (movement.axis === 'y' && movement.dy < -70) {
    closePhoto(true);
    return;
  }
  if (!movement.axis) {
    // Pointer capture retargets events: check the actual photo bounds instead of click.target.
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    if (!hit?.closest('.photo-swiper__image')) {
      closePhoto();
      return;
    }
  }
  const step = movement.axis === 'x' && Math.abs(movement.dx) > 40 ? (movement.dx < 0 ? 1 : -1) : 0;
  settlePhoto(startIndex + step);
}
function cancelGesture() {
  gesture.cancel();
  settlePhoto(startIndex);
}
const visibleCount = ref(5);
const activeFilter = ref<PhotoFilter>('all');
const selectedId = ref<string | null>(null);
const closing = ref(false);
const swipeClose = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | undefined;
function closePhoto(fromSwipe = false) {
  if (closing.value || !selectedId.value) return;
  swipeClose.value = fromSwipe;
  closing.value = true;
  closeTimer = setTimeout(
    () => {
      selectedId.value = null;
      closing.value = false;
      swipeClose.value = false;
    },
    matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260,
  );
}
onUnmounted(() => clearTimeout(closeTimer));
const announcement = ref('');
const galleryPhotos = computed(() => [
  ...(siteImages.value.studio
    ? [
        {
          id: 'site-studio',
          title: siteImages.value.studio.isDemo ? 'Пример интерьера бани' : 'Баня у Виктории',
          url: siteImages.value.studio.url,
          isDemo: siteImages.value.studio.isDemo,
          objectPosition: 'center',
          group: 'bath' as const,
        },
      ]
    : []),
  ...photos.value
    .filter((photo) => photo.url !== siteImages.value.studio?.url)
    .map((photo) => ({
      ...photo,
      group:
        services.value.find((service) => service.id === photo.serviceId)?.rentalUnit === 'day'
          ? ('bedroom' as const)
          : ('bath' as const),
    })),
]);
const filters = computed(() =>
  [
    { id: 'all' as const, label: 'Все фото', count: galleryPhotos.value.length },
    {
      id: 'bath' as const,
      label: 'Баня',
      count: galleryPhotos.value.filter((photo) => photo.group === 'bath').length,
    },
    {
      id: 'bedroom' as const,
      label: 'Спальня',
      count: galleryPhotos.value.filter((photo) => photo.group === 'bedroom').length,
    },
  ].filter((filter) => filter.count > 0),
);
const filteredPhotos = computed(() =>
  activeFilter.value === 'all'
    ? galleryPhotos.value
    : galleryPhotos.value.filter((photo) => photo.group === activeFilter.value),
);
const visiblePhotos = computed(() => filteredPhotos.value.slice(0, visibleCount.value));
const selectedIndex = computed(() =>
  filteredPhotos.value.findIndex((photo) => photo.id === selectedId.value),
);
const selectedPhoto = computed(() => filteredPhotos.value[selectedIndex.value]);
const hasMore = computed(() => visibleCount.value < filteredPhotos.value.length);
watch(
  activeFilter,
  () => {
    visibleCount.value = 5;
    selectedId.value = null;
    announcement.value = `Показано ${visiblePhotos.value.length} из ${filteredPhotos.value.length} фото.`;
  },
  { flush: 'sync' },
);
watch(
  filteredPhotos,
  (items) => {
    if (!items.length && activeFilter.value !== 'all') activeFilter.value = 'all';
    if (selectedId.value && !items.some((photo) => photo.id === selectedId.value))
      selectedId.value = null;
  },
  { flush: 'sync' },
);
let resizeObserver: ResizeObserver | undefined;
let measuredWidth = 0;
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    const element = swiper.value;
    if (!element?.clientWidth || selectedIndex.value < 0) return;
    measuredWidth = element.clientWidth;
    element.scrollTo({ left: selectedIndex.value * measuredWidth, behavior: 'instant' });
  });
  if (swiper.value) resizeObserver.observe(swiper.value);
});
onUnmounted(() => resizeObserver?.disconnect());
async function openPhoto(id: string) {
  selectedId.value = id;
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  swiper.value?.scrollTo({
    left: selectedIndex.value * swiper.value.clientWidth,
    behavior: 'instant',
  });
}
function onSwipe() {
  const element = swiper.value;
  if (!element?.clientWidth || element.clientWidth !== measuredWidth) return;
  const photo = filteredPhotos.value[Math.round(element.scrollLeft / element.clientWidth)];
  if (photo) selectedId.value = photo.id;
}
function movePhoto(direction: number) {
  if (selectedIndex.value < 0 || filteredPhotos.value.length < 2) return;
  const index =
    (selectedIndex.value + direction + filteredPhotos.value.length) % filteredPhotos.value.length;
  swiper.value?.scrollTo({
    left: index * swiper.value.clientWidth,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}
function onDialogKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || !selectedPhoto.value) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  event.stopPropagation();
  movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
}
async function showMore() {
  const firstNewIndex = visiblePhotos.value.length;
  visibleCount.value += 4;
  await nextTick();
  content.value
    ?.querySelectorAll<HTMLElement>('.work-gallery__photo')
    [firstNewIndex]?.focus({ preventScroll: true });
  announcement.value = `Показано ${visiblePhotos.value.length} из ${filteredPhotos.value.length} фото.`;
}
</script>

<style scoped>
.work-gallery {
  background: transparent;
}
.work-gallery__demo-note {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px;
}
.work-gallery__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.work-gallery__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.work-gallery__filter {
  min-height: 52px;
  padding: 10px 16px;
  border: 1px solid var(--line);
  border-radius: 30px;
  background: var(--control-bg);
  color: var(--brand);
  font-size: 16px;
}
.work-gallery__filter:hover {
  border-color: var(--accent);
}
.work-gallery__filter[aria-pressed='true'] {
  border-color: var(--neon);
  background: var(--selected-bg);
  color: var(--selected-text);
}
.work-gallery__filter-count {
  margin-left: 5px;
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
}
.work-gallery__count {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
.work-gallery__grid {
  display: grid;
  grid-template-columns: 1.18fr 0.82fr;
  gap: 18px;
}
.work-gallery__photo {
  margin: 0;
  min-width: 0;
  position: relative;
  overflow: hidden;
  height: 245px;
  border-radius: 16px;
  background: var(--surface-soft);
}
.work-gallery__photo--main {
  grid-row: span 2;
  height: 508px;
}
.work-gallery__photo:only-child {
  grid-column: 1 / -1;
  grid-row: auto;
  justify-self: center;
  width: min(100%, 900px);
  height: clamp(300px, 42vw, 560px);
}
.work-gallery__photo:focus {
  outline: 3px solid var(--focus);
  outline-offset: 4px;
}
.work-gallery__preview {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}
.work-gallery__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-orientation: from-image;
  transition: transform 450ms ease;
}
.work-gallery__preview:hover .work-gallery__image {
  transform: scale(1.035);
}
.work-gallery__caption {
  position: absolute;
  inset: auto 0 0;
  padding: 45px 24px 20px;
  background: linear-gradient(transparent, #100a1bee);
  color: var(--ink);
  font-size: 16px;
  pointer-events: none;
  overflow-wrap: anywhere;
}
.work-gallery__zoom {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: #21132fe6;
  color: var(--brand);
  font-size: 22px;
}
.work-gallery__more {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 18px 28px;
  margin-top: 30px;
  text-align: center;
}
.work-gallery__more > button span {
  margin-left: 20px;
}
.work-gallery__dates {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 52px;
  color: var(--brand);
  font-size: 16px;
  text-underline-offset: 5px;
}
.work-gallery__dialog {
  border-color: var(--line);
  background: var(--surface);
}
.work-gallery__dialog::backdrop {
  background: #0c0614d9;
}
.work-gallery__dialog :deep(.media-dialog__header) {
  border-color: var(--line);
  background: var(--surface);
}

.work-gallery__expanded {
  display: block;
  max-width: 100%;
  max-height: 65dvh;
  margin: auto;
  object-fit: contain;
}
.work-gallery__viewer-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-block: 18px;
}
.work-gallery__viewer-arrow {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--control-bg);
  color: var(--brand);
  font-size: 24px;
}
.work-gallery__viewer-position {
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.work-gallery__filter:focus-visible,
.work-gallery__viewer-arrow:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}
.gallery-empty {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 54px;
  align-items: center;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface);
}
.gallery-empty__collage {
  display: grid;
  grid-template-columns: 1.1fr 0.75fr;
  grid-template-rows: 170px 170px;
  gap: 12px;
}
.gallery-empty__frame {
  position: relative;
  display: flex;
  align-items: end;
  justify-content: center;
  overflow: hidden;
  border-radius: 9px;
  background: var(--surface-soft);
}
.gallery-empty__frame--main {
  grid-row: span 2;
  background:
    repeating-linear-gradient(90deg, #ff95d41a 0 1px, transparent 1px 44px),
    linear-gradient(130deg, #46205f, #261335);
}
.gallery-empty__arch {
  position: absolute;
  width: 70%;
  height: 78%;
  bottom: -10px;
  border: 1px solid #ff95d45c;
  border-radius: 100px 100px 0 0;
}
.gallery-empty__arch::after {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid #ead7ff3d;
  border-radius: inherit;
}
.gallery-empty__frame--bedroom {
  background: linear-gradient(150deg, #55266d, #2b1a3b);
}
.gallery-empty__frame--detail {
  background: radial-gradient(ellipse at 120% 0, #703b79, transparent), #321c45;
}
.gallery-empty__frame-label {
  position: relative;
  font-size: 14px;
  letter-spacing: 0.16em;
  color: var(--ink);
  padding: 18px 6px;
}
.gallery-empty__frame--bedroom .gallery-empty__frame-label {
  color: var(--ink);
}
.gallery-empty__copy {
  padding: 24px 24px 24px 0;
}
.gallery-empty__copy .section-heading__kicker {
  font-size: 14px;
  margin-bottom: 18px;
}
.gallery-empty__title {
  font-family: var(--display);
  font-size: clamp(30px, 3vw, 42px);
  line-height: 1.25;
  font-weight: 400;
  letter-spacing: -0.03em;
}
.gallery-empty__title em {
  color: var(--accent);
}
.gallery-empty__text {
  margin: 20px 0;
  font-size: 16px;
  line-height: 1.9;
  color: var(--muted);
}
.gallery-empty__link {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  min-height: 52px;
  font-size: 16px;
  color: var(--brand);
  text-underline-offset: 6px;
}
@media (max-width: 991.98px) {
  .gallery-empty {
    gap: 28px;
  }
  .gallery-empty__copy {
    padding-right: 0;
  }
  .gallery-empty__collage {
    grid-template-rows: 150px 150px;
  }
}
@media (max-width: 767.98px) {
  .gallery-empty {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 20px;
  }
  .gallery-empty__collage {
    grid-template-rows: 130px 130px;
  }
  .gallery-empty__copy {
    padding: 8px 8px 18px;
  }
  .work-gallery__grid {
    gap: 12px;
  }
  .work-gallery__photo {
    height: 170px;
  }
  .work-gallery__photo--main {
    height: 352px;
  }
  .work-gallery__caption {
    font-size: 16px;
    padding: 40px 12px 14px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .work-gallery__image {
    transition: none;
  }
  .work-gallery__preview:hover .work-gallery__image {
    transform: none;
  }
}
@media (max-width: 575.98px) {
  .work-gallery__grid {
    grid-template-columns: 1fr 1fr;
  }
  .work-gallery__photo {
    height: 190px;
  }
  .work-gallery__photo--main {
    grid-column: 1 / -1;
    grid-row: auto;
    height: 310px;
  }
}

.work-gallery .work-gallery__dialog {
  inset: 0;
  width: 100%;
  max-width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0;
  border: 0;
  border-radius: 0;
  overflow: hidden;
  background: #100b17;
}
.work-gallery .work-gallery__dialog[open] {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}
.work-gallery__dialog :deep(.media-dialog__header) {
  min-height: 64px;
  box-sizing: border-box;
  position: relative;
  padding-top: max(12px, env(safe-area-inset-top));
}
.work-gallery__dialog :deep(.media-dialog__title) {
  font-size: 18px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.work-gallery__dialog :deep(.media-dialog__content) {
  padding: 0;
  min-height: 0;
  min-width: 0;
  position: relative;
}
.photo-swiper {
  position: absolute;
  inset: 16px max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom))
    max(12px, env(safe-area-inset-left));
  display: flex;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  touch-action: pinch-zoom;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}
.photo-swiper::-webkit-scrollbar {
  display: none;
}
.photo-swiper__slide {
  flex: 0 0 100%;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-swiper__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  user-select: none;
}

.work-gallery .work-gallery__dialog--closing {
  animation: gallery-dismiss 260ms ease-in both;
  pointer-events: none;
}
.work-gallery__dialog--closing::backdrop {
  animation: gallery-dismiss 260ms ease-in both;
}
.work-gallery__dialog--swipe-close .photo-swiper {
  animation: gallery-rise-away 260ms cubic-bezier(0.3, 0, 0.8, 0.4) both;
}
@keyframes gallery-dismiss {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes gallery-rise-away {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-12vh);
  }
}
@media (prefers-reduced-motion: reduce) {
  .work-gallery .work-gallery__dialog--closing,
  .work-gallery__dialog--closing::backdrop,
  .work-gallery__dialog--swipe-close .photo-swiper {
    animation: none;
  }
}
.section-heading__intro {
  max-width: 720px;
  margin: 0;
}
</style>
