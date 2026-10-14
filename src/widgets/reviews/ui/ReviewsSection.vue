<template>
  <section class="reviews content-section container" aria-labelledby="reviews-title">
    <h2 id="reviews-title" class="section-heading__title">
      После отдыха <em class="section-heading__accent">остаются впечатления.</em>
    </h2>
    <p class="reviews__note">
      Поделитесь впечатлениями о нашей бане — ваш отзыв поможет другим гостям выбрать отдых.
    </p>
    <div
      ref="track"
      class="reviews__grid"
      :class="{ 'is-dragging': dragging }"
      tabindex="0"
      aria-label="Отзывы гостей"
      @scroll="onScroll"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @keydown.left.prevent="go(current - 1, true)"
      @keydown.right.prevent="go(current + 1, true)"
      @wheel.passive="interact"
      @keydown="interact"
      @focusin="interact"
    >
      <article
        v-for="(review, index) in slides"
        :key="index"
        class="reviews__card"
        :aria-hidden="index === 0 || index === slides.length - 1"
      >
        <span class="reviews__stars" aria-label="5 из 5 звёзд">★★★★★</span>
        <p>{{ review.text }}</p>
        <strong class="reviews__author">{{ review.name }}</strong>
      </article>
    </div>
    <button type="button" class="btn btn-primary reviews__add" @click="open = true">
      Оставить отзыв
    </button>
    <MediaDialog :open="open" title="Ваш отзыв" class="reviews__dialog" @close="open = false">
      <form class="review-form" @submit.prevent="submit">
        <fieldset>
          <legend>Ваша оценка</legend>
          <div class="review-form__stars">
            <label v-for="star in 5" :key="star" :class="{ 'is-filled': star <= Number(rating) }">
              <input
                v-model="rating"
                type="radio"
                name="review-rating"
                :value="star"
                required
                :aria-label="star + ' из 5 звёзд'"
              />
              <span aria-hidden="true">★</span>
            </label>
          </div>
        </fieldset>
        <label class="review-form__field"
          >Ваше имя<input
            v-model="name"
            class="form-control"
            autocomplete="name"
            maxlength="60"
            required
            placeholder="Как вас зовут"
        /></label>
        <label class="review-form__field"
          >Комментарий<textarea
            v-model="comment"
            class="form-control"
            rows="4"
            minlength="10"
            maxlength="1500"
            required
            placeholder="Что вам понравилось? Поделитесь впечатлениями об отдыхе."
          />
        </label>

        <button type="submit" class="btn btn-primary">Отправить отзыв</button>
        <p v-if="notice" role="status" class="review-form__notice">{{ notice }}</p>
      </form>
    </MediaDialog>
  </section>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { MediaDialog } from '../../../shared/ui/index.ts';
const open = ref(false);
const track = ref<HTMLElement | null>(null);
const current = ref(1);
const paused = ref(false);
const dragging = ref(false);
let dragStartX = 0;
let dragStartScroll = 0;
let dragStartIndex = 0;
function startDrag(event: PointerEvent) {
  interact();
  if (event.pointerType !== 'mouse' || event.button !== 0 || !track.value) return;
  dragging.value = true;
  dragStartX = event.clientX;
  dragStartScroll = track.value.scrollLeft;
  dragStartIndex = current.value;
  track.value.setPointerCapture(event.pointerId);
}
function moveDrag(event: PointerEvent) {
  if (!dragging.value || !track.value) return;
  track.value.scrollLeft = dragStartScroll + dragStartX - event.clientX;
  interact();
}
function endDrag(event: PointerEvent) {
  interact();
  if (!dragging.value || !track.value) return;
  const distance = dragStartX - event.clientX;
  dragging.value = false;
  if (track.value.hasPointerCapture(event.pointerId))
    track.value.releasePointerCapture(event.pointerId);
  const target =
    event.type !== 'pointercancel' && Math.abs(distance) > 40
      ? dragStartIndex + Math.sign(distance)
      : dragStartIndex;
  requestAnimationFrame(() => go(Math.max(0, Math.min(slides.length - 1, target)), true));
}
let nextAt = 0;
let timer: ReturnType<typeof setInterval> | undefined;
let settleTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | undefined;
function interact() {
  nextAt = Date.now() + 10000;
}
function go(index: number, manual = false, instant = false) {
  if (manual) interact();
  const el = track.value;
  const card = el?.children[index] as HTMLElement | undefined;
  if (el && card)
    el.scrollTo({
      left: card.offsetLeft - (el.children[0] as HTMLElement).offsetLeft,
      behavior:
        instant || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
}
function onScroll() {
  const el = track.value;
  if (!el) return;
  const step =
    (el.children[1] as HTMLElement)?.offsetLeft - (el.children[0] as HTMLElement)?.offsetLeft;
  if (step) current.value = Math.round(el.scrollLeft / step);
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    if (dragging.value) return;
    if (current.value === 0) go(reviews.length, false, true);
    else if (current.value === slides.length - 1) go(1, false, true);
  }, 120);
}
onMounted(() => {
  go(1, false, true);
  resizeObserver = new ResizeObserver(() => go(current.value, false, true));
  if (track.value) resizeObserver.observe(track.value);
  paused.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
  nextAt = Date.now() + 5000;
  timer = setInterval(() => {
    const rect = track.value?.getBoundingClientRect();
    if (
      paused.value ||
      dragging.value ||
      open.value ||
      document.hidden ||
      !rect ||
      rect.bottom < 0 ||
      rect.top > innerHeight ||
      Date.now() < nextAt
    )
      return;
    go(current.value + 1);
    nextAt = Date.now() + 5000;
  }, 500);
});
onUnmounted(() => {
  clearInterval(timer);
  clearTimeout(settleTimer);
  resizeObserver?.disconnect();
});
const name = ref('');
const rating = ref<number | ''>('');
const comment = ref('');
const notice = ref('');
function submit() {
  notice.value = 'Отзыв не отправлен: приём отзывов ещё не подключён. Текст остался в форме.';
}

const reviews = [
  {
    name: 'Анна',
    text: 'Тихий вечер, тёплая парная и возможность никуда не спешить. Именно такой отдых хотелось устроить.',
  },
  {
    name: 'Дмитрий',
    text: 'Приехали небольшой компанией. Хорошо попарились и спокойно провели время вместе.',
  },
  { name: 'Елена', text: 'Удобно остаться с ночёвкой после бани — отдохнуть и уехать уже утром.' },
];
const slides = [reviews[reviews.length - 1]!, ...reviews, reviews[0]!];
</script>
<style scoped>
.reviews__note {
  color: var(--muted);
  margin: 18px 0 28px;
}
.reviews__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.reviews__card {
  display: flex;
  flex-direction: column;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface-raised);
}
.reviews__quote {
  color: var(--accent);
  font-family: var(--display);
  font-size: 64px;
  line-height: 1;
}
.reviews__card p {
  font-size: 17px;
  line-height: 1.75;
  margin: 8px 0 24px;
}
.reviews__label {
  margin-top: auto;
  color: var(--muted);
  font-size: 14px;
}
@media (max-width: 767.98px) {
  .reviews__grid {
    grid-template-columns: 1fr;
  }
  .reviews__card {
    padding: 24px;
  }
}

.reviews__add {
  margin-top: 24px;
}
.reviews__dialog {
  width: min(560px, calc(100% - 24px));
}
.review-form {
  padding: 8px;
}
.review-form legend {
  font-size: 16px;
  margin-bottom: 8px;
}
.review-form__stars {
  display: flex;
  gap: 8px;
}
.review-form__stars label {
  position: relative;
  width: 44px;
  height: 48px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: #9b83ae;
}
.review-form__stars input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.review-form__stars span {
  font-size: 36px;
  line-height: 1;
}
.review-form__stars .is-filled {
  color: #ff95d4;
}
.review-form__stars label:has(input:focus-visible) {
  outline: 2px solid #ff95d4;
  border-radius: 8px;
}
.review-form__field {
  display: grid;
  gap: 8px;
  margin-top: 20px;
}
.review-form .form-control {
  background: var(--control-bg);
  color: var(--ink);
  border-color: var(--line);
  padding: 12px 14px;
  border-radius: 14px;
}
.review-form .form-control::placeholder {
  color: var(--muted);
}
.review-form textarea {
  resize: vertical;
}
.review-form__note {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  margin: 20px 0;
}
.review-form__notice {
  margin: 16px 0 0;
  color: var(--accent);
}

.reviews__grid {
  display: flex;
  cursor: grab;
  user-select: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  gap: 20px;
}
.reviews__grid.is-dragging {
  cursor: grabbing;
  scroll-snap-type: none;
}
.reviews__author {
  margin-top: auto;
  color: var(--ink);
}
.reviews__card {
  flex: 0 0 100%;
  scroll-snap-align: start;
  box-sizing: border-box;
}
.reviews__stars {
  color: var(--accent);
  letter-spacing: 5px;
  font-size: 24px;
}
.reviews__controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
.reviews__controls button {
  min-width: 44px;
  min-height: 44px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--ink);
  background: var(--control-bg);
}
.reviews__controls button[aria-pressed='true'] {
  background: var(--selected-bg);
}
</style>
