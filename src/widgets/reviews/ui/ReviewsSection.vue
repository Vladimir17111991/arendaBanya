<template>
  <section class="reviews content-section container" aria-labelledby="reviews-title">
    <h2 id="reviews-title" class="section-heading__title">
      После отдыха <em class="section-heading__accent">остаются впечатления.</em>
    </h2>
    <p class="reviews__note">
      Поделитесь впечатлениями о нашей бане — ваш отзыв поможет другим гостям выбрать отдых.
    </p>
    <div
      ref="review-track"
      class="reviews__grid"
      :class="{ 'is-dragging': dragging }"
      tabindex="0"
      role="region"
      aria-roledescription="карусель"
      aria-label="Отзывы гостей"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
      @touchstart.passive="startTouch"
      @touchend.passive="endTouch"
      @touchcancel.passive="endTouch"
      @scroll.passive="onScroll"
      @scrollend="finishTouchScroll"
      @keydown.left.prevent="advance(-1)"
      @keydown.right.prevent="advance(1)"
      @wheel="onWheel"
      @keydown="interact"
      @focusin="interact"
    >
      <article
        v-for="(review, index) in slides"
        :key="index"
        class="reviews__card"
        :aria-hidden="index < reviews.length || index >= reviews.length * 2"
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path
                  d="m12 2.8 2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.37l-5.7 3 1.09-6.36-4.62-4.5 6.38-.93L12 2.8Z"
                />
              </svg>
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

        <button type="submit" class="btn btn-primary review-form__submit">Отправить отзыв</button>
        <p v-if="notice" role="status" class="review-form__notice">{{ notice }}</p>
      </form>
    </MediaDialog>
  </section>
</template>
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { MediaDialog } from '../../../shared/ui/index.ts';
import { useReviewCarousel } from '../model/useReviewCarousel.ts';
const open = ref(false);
const track = useTemplateRef<HTMLElement>('review-track');
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
const slides = [...reviews, ...reviews, ...reviews];
const {
  dragging,
  startDrag,
  moveDrag,
  endDrag,
  startTouch,
  endTouch,
  onScroll,
  finishTouchScroll,
  onWheel,
  advance,
  interact,
} = useReviewCarousel(reviews.length, open, track);
</script>
<style scoped>
.reviews__note {
  color: var(--muted);
  margin: 18px 0 28px;
}
.reviews__grid {
  display: flex;
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  user-select: none;
  touch-action: pan-x pan-y pinch-zoom;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  gap: 20px;
  border-radius: 24px;
}
.reviews__grid::-webkit-scrollbar {
  display: none;
}
.reviews__grid:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
.reviews__grid.is-dragging {
  cursor: grabbing;
}
.reviews__card {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  flex: 0 0 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface-raised);
}
@media (min-width: 768px) {
  .reviews__card {
    flex-basis: calc((100% - 20px) / 2);
  }
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
  color: #b7997a;
}
.review-form__stars input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.review-form__stars svg {
  width: 36px;
  height: 36px;
  pointer-events: none;
}
.review-form__stars .is-filled {
  color: #ffd185;
}
.review-form__stars .is-filled svg {
  fill: currentColor;
}
.review-form__stars label:has(input:focus-visible) {
  outline: 2px solid #deb989;
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
.review-form__submit {
  display: block;
  margin-top: 24px;
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

.reviews__author {
  margin-top: auto;
  color: var(--ink);
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
