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
      </div>
      <div
        v-if="galleryPhotos.length"
        id="gallery-photo-grid"
        ref="content"
        class="work-gallery__grid"
      >
        <div
          v-for="group in photoGroups"
          :key="group[0].id"
          class="work-gallery__collage"
          :class="{ 'work-gallery__collage--small': group.length < 5 }"
          :style="{ '--photo-count': group.length }"
        >
          <figure v-for="photo in group" :key="photo.id" class="work-gallery__photo">
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
          </figure>
        </div>
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
            Здесь появятся фотографии бани и спальни. Пока можно посмотреть свободные даты и
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
          Ещё фотографии
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
      title="Галерея"
      @close="closePhoto()"
      @keydown="onDialogKeydown"
    >
      <div
        ref="swiper"
        class="photo-swiper"
        role="region"
        aria-label="Фотографии бани — листайте влево или вправо"
        tabindex="0"
        @pointerdown="startGesture"
        @pointermove="moveGesture"
        @pointerup="endGesture"
        @pointercancel="cancelGesture"
        @lostpointercapture="gesture.cancel()"
      >
        <div class="photo-swiper__track">
          <div v-for="photo in filteredPhotos" :key="photo.id" class="photo-swiper__slide">
            <img
              :src="photo.url"
              :alt="photo.title"
              draggable="false"
              class="photo-swiper__image"
            />
          </div>
        </div>
      </div>
      <nav ref="thumbnails" class="photo-thumbnails" aria-label="Выбрать фотографию">
        <button
          v-for="(photo, index) in filteredPhotos"
          :key="photo.id"
          type="button"
          :aria-label="'Фото ' + (index + 1) + ': ' + photo.title"
          :aria-current="selectedId === photo.id ? 'true' : undefined"
          @click="settlePhoto(index)"
        >
          <img :src="photo.url" alt="" loading="lazy" draggable="false" />
        </button>
      </nav>
    </MediaDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import {
  usePractice,
  galleryCategoryLabel,
  sortGalleryPhotos,
} from '../../../entities/practice/index.ts';
import { MediaDialog } from '../../../shared/ui/index.ts';
import { createLoopCarousel, type EmblaCarouselType } from '../../../shared/lib/carousel/index.ts';
import { createPhotoGesture } from '../model/photoGesture.ts';

type PhotoFilter = 'all' | number;
const { photos, siteImages, categories } = usePractice();
const content = ref<HTMLElement | null>(null);
const swiper = ref<HTMLElement | null>(null);
const gesture = createPhotoGesture();
let photoCarousel: EmblaCarouselType | undefined;
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
  gesture.begin(point(event));
  element.setPointerCapture(event.pointerId);
}
function moveGesture(event: PointerEvent) {
  // Embla owns horizontal motion; this gesture only handles dismissal and taps.
  gesture.move(point(event));
}
function settlePhoto(index: number) {
  if (!photoCarousel || closing.value) return;
  const target = Math.max(0, Math.min(filteredPhotos.value.length - 1, index));
  photoCarousel.scrollTo(target, matchMedia('(prefers-reduced-motion: reduce)').matches);
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
}
function cancelGesture() {
  gesture.cancel();
}
const collageSize = 9;
const visibleCount = ref(collageSize);
const activeFilter = ref<PhotoFilter>('all');
const selectedId = ref<string | null>(null);
const thumbnails = ref<HTMLElement | null>(null);
watch(selectedId, async () => {
  if (!selectedId.value) {
    photoCarousel?.destroy();
    photoCarousel = undefined;
    gesture.cancel();
  }
  await nextTick();
  centerThumbnail();
});
function centerThumbnail() {
  const strip = thumbnails.value;
  const active = strip?.querySelector<HTMLElement>('[aria-current="true"]');
  if (strip && active)
    strip.scrollTo({
      left: active.offsetLeft - strip.clientWidth / 2 + active.offsetWidth / 2,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
}
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
onUnmounted(() => {
  clearTimeout(closeTimer);
  photoCarousel?.destroy();
});
const announcement = ref('');
const galleryPhotos = computed(() =>
  sortGalleryPhotos(categories.value, [
    ...(siteImages.value.studio
      ? [
          {
            id: 'site-studio',
            title: siteImages.value.studio.isDemo ? 'Пример интерьера бани' : 'Баня у Виктории',
            url: siteImages.value.studio.url,
            isDemo: siteImages.value.studio.isDemo,
            objectPosition: 'center',
            categoryIds: categories.value[0] ? [categories.value[0].id] : [],
          },
        ]
      : []),
    ...photos.value.filter((photo) => photo.url !== siteImages.value.studio?.url),
  ]),
);
const filters = computed(() =>
  [
    { id: 'all' as const, label: 'Все фото', count: galleryPhotos.value.length },
    ...categories.value.map((category) => ({
      id: category.id,
      label: galleryCategoryLabel(category),
      count: galleryPhotos.value.filter((photo) => photo.categoryIds.includes(category.id)).length,
    })),
  ].filter((filter) => filter.count > 0),
);
const filteredPhotos = computed(() =>
  activeFilter.value === 'all'
    ? galleryPhotos.value
    : galleryPhotos.value.filter((photo) =>
        photo.categoryIds.includes(activeFilter.value as number),
      ),
);
const visiblePhotos = computed(() => filteredPhotos.value.slice(0, visibleCount.value));
const photoGroups = computed(() => {
  const groups = [];
  for (let index = 0; index < visiblePhotos.value.length; index += collageSize)
    groups.push(visiblePhotos.value.slice(index, index + collageSize));
  return groups;
});
const selectedIndex = computed(() =>
  filteredPhotos.value.findIndex((photo) => photo.id === selectedId.value),
);
const selectedPhoto = computed(() => filteredPhotos.value[selectedIndex.value]);
const hasMore = computed(() => visibleCount.value < filteredPhotos.value.length);
watch(
  activeFilter,
  () => {
    visibleCount.value = collageSize;
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
async function openPhoto(id: string) {
  selectedId.value = id;
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  if (!swiper.value || selectedId.value !== id || closing.value) return;
  photoCarousel?.destroy();
  photoCarousel = createLoopCarousel(swiper.value, { startIndex: selectedIndex.value });
  photoCarousel.on('select', (api) => {
    selectedId.value = filteredPhotos.value[api.selectedScrollSnap()]?.id ?? null;
  });
  photoCarousel.on('reInit', centerThumbnail);
}
function movePhoto(direction: number) {
  if (!photoCarousel || closing.value) return;
  const jump = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (direction > 0) photoCarousel.scrollNext(jump);
  else photoCarousel.scrollPrev(jump);
}
function onDialogKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || !selectedPhoto.value) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  event.stopPropagation();
  movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
}
async function showMore(event: MouseEvent) {
  const firstNewIndex = visiblePhotos.value.length;
  visibleCount.value += collageSize;
  await nextTick();
  if (event.detail === 0) {
    content.value
      ?.querySelectorAll<HTMLElement>('.work-gallery__preview')
      [firstNewIndex]?.focus({ preventScroll: true });
  }
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
  gap: 48px;
  padding-block: 12px;
}
.work-gallery__collage {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(100, minmax(0, 1fr));
  grid-template-rows: repeat(100, minmax(0, 1fr));
  aspect-ratio: 2.15;
}
.work-gallery__photo {
  margin: 0;
  min-width: 0;
  min-height: 0;
  position: relative;
  border-radius: 8px;
  background: var(--surface-soft);
  box-shadow: 0 12px 32px #110f0e66;
  transition:
    transform 240ms ease,
    box-shadow 240ms ease;
}
.work-gallery__photo:nth-child(1) {
  grid-area: 2 / 41 / 69 / 68;
  z-index: 4;
}
.work-gallery__photo:nth-child(2) {
  grid-area: 19 / 11 / 81 / 40;
  z-index: 5;
}
.work-gallery__photo:nth-child(3) {
  grid-area: 38 / 64 / 100 / 93;
  z-index: 6;
}
.work-gallery__photo:nth-child(4) {
  grid-area: 61 / 35 / 99 / 67;
  z-index: 7;
}
.work-gallery__photo:nth-child(5) {
  grid-area: 40 / 1 / 75 / 20;
  z-index: 2;
}
.work-gallery__photo:nth-child(6) {
  grid-area: 5 / 8 / 50 / 32;
  z-index: 1;
}
.work-gallery__photo:nth-child(7) {
  grid-area: 9 / 64 / 57 / 87;
  z-index: 1;
}
.work-gallery__photo:nth-child(8) {
  grid-area: 34 / 86 / 70 / 101;
  z-index: 3;
}
.work-gallery__photo:nth-child(9) {
  grid-area: 70 / 21 / 101 / 43;
  z-index: 2;
}
.work-gallery__photo:focus-within {
  z-index: 10;
}
.work-gallery__preview:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 4px;
}
@media (hover: hover) {
  .work-gallery__photo:hover {
    z-index: 10;
    transform: translateY(-6px);
    box-shadow: 0 20px 42px #110f0e99;
  }
}
.work-gallery__collage--small {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: auto;
  padding-block: 20px;
}
.work-gallery__collage--small .work-gallery__photo {
  flex: 0 1 360px;
  width: calc(100% / var(--photo-count));
  aspect-ratio: 4 / 3;
}
.work-gallery__collage--small .work-gallery__photo:nth-child(even) {
  margin-left: -24px;
  transform: translateY(20px);
}
.work-gallery__preview {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: inherit;
  overflow: hidden;
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
  background: linear-gradient(transparent, #231b16ee);
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
  background: #30251de6;
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
  background: #191613d9;
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
    repeating-linear-gradient(90deg, #deb9891a 0 1px, transparent 1px 44px),
    linear-gradient(130deg, #473f38, #35271e);
}
.gallery-empty__arch {
  position: absolute;
  width: 70%;
  height: 78%;
  bottom: -10px;
  border: 1px solid #deb9895c;
  border-radius: 100px 100px 0 0;
}
.gallery-empty__arch::after {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid #f3e4cf3d;
  border-radius: inherit;
}
.gallery-empty__frame--bedroom {
  background: linear-gradient(150deg, #604a33, #3b2e23);
}
.gallery-empty__frame--detail {
  background: radial-gradient(ellipse at 120% 0, #755a3f, transparent), #443427;
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
}
@media (prefers-reduced-motion: reduce) {
  .work-gallery__photo,
  .work-gallery__image {
    transition: none;
  }
  .work-gallery__preview:hover .work-gallery__image {
    transform: none;
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
  background: #211914;
}
.work-gallery .work-gallery__dialog[open] {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
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
  inset: max(64px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
    calc(92px + env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  touch-action: pinch-zoom;
}
.photo-swiper__track {
  display: flex;
  width: 100%;
  height: 100%;
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

.work-gallery__filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: min(100%, 420px);
}
.work-gallery__filter {
  width: 100%;
  padding-inline: 8px;
}
.work-gallery__dialog :deep(.media-dialog__header) {
  position: absolute;
  inset: 0 0 auto;
  height: 0;
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
  z-index: 3;
}
.work-gallery__dialog :deep(.media-dialog__title) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.work-gallery__dialog :deep(.media-dialog__close) {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
}
.photo-thumbnails {
  position: absolute;
  inset: auto max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom))
    max(12px, env(safe-area-inset-left));
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 6px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.photo-thumbnails::before,
.photo-thumbnails::after {
  content: '';
  flex: 0 0 calc(50% - 48px);
}
.photo-thumbnails button {
  flex: 0 0 76px;
  height: 58px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  background: #34271e;
  opacity: 0.65;
}
.photo-thumbnails button[aria-current='true'] {
  border-color: #cbb8a4;
  opacity: 1;
  box-shadow: 0 0 0 2px #cbb8a444;
}
.photo-thumbnails button:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}
.photo-thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (max-width: 575.98px) {
  .work-gallery__filter {
    font-size: 14px;
  }
  .work-gallery__grid {
    gap: 32px;
  }
  .work-gallery__collage {
    aspect-ratio: 0.72;
  }
  .work-gallery__photo:nth-child(1) {
    grid-area: 1 / 25 / 37 / 85;
  }
  .work-gallery__photo:nth-child(2) {
    grid-area: 25 / 1 / 56 / 57;
  }
  .work-gallery__photo:nth-child(3) {
    grid-area: 47 / 46 / 80 / 101;
  }
  .work-gallery__photo:nth-child(4) {
    grid-area: 76 / 8 / 101 / 72;
  }
  .work-gallery__photo:nth-child(5) {
    grid-area: 10 / 1 / 30 / 32;
  }
  .work-gallery__photo:nth-child(6) {
    grid-area: 54 / 1 / 78 / 35;
  }
  .work-gallery__photo:nth-child(7) {
    grid-area: 7 / 69 / 31 / 101;
  }
  .work-gallery__photo:nth-child(8) {
    grid-area: 78 / 75 / 98 / 101;
  }
  .work-gallery__photo:nth-child(9) {
    grid-area: 36 / 33 / 61 / 78;
  }
  .work-gallery__collage--small {
    aspect-ratio: auto;
    flex-wrap: wrap;
    gap: 12px 0;
  }
  .work-gallery__collage--small .work-gallery__photo {
    flex-basis: 52%;
  }
  .work-gallery__collage--small .work-gallery__photo:only-child {
    flex-basis: 100%;
  }
  .work-gallery__collage--small .work-gallery__photo:nth-child(even) {
    margin-left: -4%;
  }
}
@media (orientation: landscape) and (max-height: 600px) {
  .photo-swiper {
    inset: 10px max(68px, env(safe-area-inset-right)) calc(66px + env(safe-area-inset-bottom))
      max(16px, env(safe-area-inset-left));
  }
  .photo-thumbnails {
    gap: 8px;
    bottom: max(4px, env(safe-area-inset-bottom));
  }
  .photo-thumbnails::before,
  .photo-thumbnails::after {
    flex-basis: calc(50% - 37px);
  }
  .photo-thumbnails button {
    flex-basis: 58px;
    height: 42px;
    border-radius: 8px;
  }
}
</style>
