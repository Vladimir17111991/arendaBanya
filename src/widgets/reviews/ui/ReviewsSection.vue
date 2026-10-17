<template>
  <section class="reviews content-section container" aria-labelledby="reviews-title">
    <h2 id="reviews-title" class="section-heading__title">
      После отдыха <em class="section-heading__accent">остаются впечатления.</em>
    </h2>
    <p class="reviews__note">
      Поделитесь впечатлениями о нашей бане — ваш отзыв поможет другим гостям выбрать отдых.
    </p>
    <p v-if="kind === 'demo'" class="reviews__note">
      Демонстрационные отзывы. Изменения сохраняются только в этой вкладке до обновления.
    </p>
    <p v-if="publicLoading && !reviews.length" role="status">Загружаем отзывы…</p>
    <p v-else-if="publicError" role="alert">
      {{ publicError }}
      <button type="button" class="btn btn-link" @click="refreshPublic">Повторить</button>
    </p>
    <p v-else-if="!reviews.length" class="reviews__note">
      {{
        kind === 'offline'
          ? 'Приём отзывов скоро появится.'
          : 'Пока нет опубликованных отзывов. Поделитесь первым впечатлением.'
      }}
    </p>
    <div
      v-if="reviews.length"
      ref="review-track"
      class="reviews__grid"
      :class="{ 'is-dragging': dragging }"
      tabindex="0"
      role="region"
      aria-roledescription="карусель"
      aria-label="Отзывы гостей"
      @keydown.left.prevent="advance(-1)"
      @keydown.right.prevent="advance(1)"
      @wheel="onWheel"
      @keydown="interact"
      @focusin="interact"
    >
      <div class="reviews__track">
        <div v-for="review in reviews" :key="review.id" class="reviews__slide">
          <article class="reviews__card">
            <strong class="reviews__author">{{ review.name }}</strong>
            <span class="reviews__stars" :aria-label="`${review.rating} из 5 звёзд`"
              >{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span
            >
            <p>{{ review.text }}</p>
            <blockquote v-if="review.reply" class="reviews__reply">
              <strong>Ответ администрации</strong>
              <p>{{ review.reply }}</p>
            </blockquote>
          </article>
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-primary reviews__add" @click="open = true">
      Оставить отзыв
    </button>
    <MediaDialog :open="open" title="Ваш отзыв" class="reviews__dialog" @close="open = false">
      <form class="review-form" @submit.prevent="submit">
        <p class="review-form__note">
          {{
            kind === 'offline'
              ? 'Приём отзывов ещё не подключён. Отправка пока недоступна.'
              : kind === 'demo'
                ? 'Проверка формы: отзыв попадёт в демонстрационный кабинет этой вкладки.'
                : 'Отзыв появится на сайте после проверки Викторией.'
          }}
        </p>
        <fieldset>
          <legend>Ваша оценка</legend>
          <div class="review-form__stars">
            <label v-for="star in 5" :key="star" :class="{ 'is-filled': star <= Number(rating) }">
              <input
                v-model="rating"
                :disabled="sending"
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
            :disabled="sending"
            class="form-control"
            autocomplete="name"
            maxlength="60"
            required
            placeholder="Как вас зовут"
        /></label>
        <label class="review-form__field"
          >Комментарий<textarea
            v-model="comment"
            :disabled="sending"
            class="form-control"
            rows="4"
            minlength="10"
            maxlength="1500"
            required
            placeholder="Что вам понравилось? Поделитесь впечатлениями об отдыхе."
          />
        </label>

        <button
          type="submit"
          class="btn btn-primary review-form__submit"
          :disabled="sending || !canSubmit"
        >
          {{ sending ? 'Отправляем…' : 'Отправить отзыв' }}
        </button>
        <p v-if="notice" role="status" class="review-form__notice">{{ notice }}</p>
      </form>
    </MediaDialog>
  </section>
</template>
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { MediaDialog } from '../../../shared/ui/index.ts';
import { useReviewCarousel } from '../model/useReviewCarousel.ts';
import { useReviews } from '../../../entities/review/index.ts';
const store = useReviews();
const { published: reviews, kind, canSubmit, publicLoading, publicError, refreshPublic } = store;
const open = ref(false);
const track = useTemplateRef<HTMLElement>('review-track');
const name = ref('');
const rating = ref<number | ''>('');
const comment = ref('');
const notice = ref('');
const sending = ref(false);
let submissionId = '';
let submissionBody = '';
async function submit() {
  if (sending.value) return;
  const draft = { name: name.value, rating: Number(rating.value), text: comment.value };
  const body = JSON.stringify(draft);
  if (!submissionId || body !== submissionBody) {
    submissionId = crypto.randomUUID();
    submissionBody = body;
  }
  sending.value = true;
  notice.value = '';
  try {
    await store.submit(submissionId, draft);
    notice.value =
      kind === 'demo'
        ? 'Демо-отзыв отправлен на проверку. Откройте «Кабинет → Отзывы» в этой вкладке.'
        : 'Спасибо! Отзыв отправлен на проверку и появится после публикации.';
    name.value = '';
    rating.value = '';
    comment.value = '';
    submissionId = '';
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : 'Не удалось отправить отзыв. Текст остался в форме.';
  } finally {
    sending.value = false;
  }
}
const { dragging, onWheel, advance, interact } = useReviewCarousel(open, track);
</script>
<style scoped>
.reviews__note {
  color: var(--muted);
  margin: 18px 0 28px;
}
.reviews__grid {
  position: relative;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: pan-y pinch-zoom;
  border-radius: 24px;
}
.reviews__track {
  display: flex;
  touch-action: pan-y pinch-zoom;
  margin-left: -20px;
}
.reviews__slide {
  flex: 0 0 100%;
  min-width: 0;
  padding-left: 20px;
}
.reviews__grid:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
.reviews__grid.is-dragging {
  cursor: grabbing;
}
.reviews__card {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface-raised);
}
@media (min-width: 768px) {
  .reviews__slide {
    flex-basis: 50%;
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
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.reviews__reply {
  margin: 16px 0 0;
  padding: 12px 16px;
  border-left: 2px solid var(--accent);
  background: var(--control-bg);
  border-radius: 0 12px 12px 0;
}
.reviews__reply p {
  font-size: 15px;
  margin-bottom: 0;
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
  height: 128px;
  overflow-y: auto;
  resize: none;
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
  display: block;
  margin-bottom: 8px;
  font-size: 18px;
  line-height: 1.4;
  overflow-wrap: anywhere;
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
