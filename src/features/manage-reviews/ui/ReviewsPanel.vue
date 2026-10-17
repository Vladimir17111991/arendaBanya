<template>
  <section class="review-management" aria-labelledby="review-management-title">
    <header class="review-management__heading">
      <div>
        <h2 id="review-management-title">Отзывы гостей</h2>
        <p>Новые отзывы видны только вам. На сайте они появятся после публикации.</p>
      </div>
      <button
        v-if="isModerator && kind === 'remote'"
        class="btn btn-outline-primary"
        type="button"
        :disabled="busy || adminLoading"
        @click="logout"
      >
        Выйти из отзывов
      </button>
    </header>
    <p v-if="kind === 'demo'" class="review-management__notice" role="status">
      Демонстрация: отзывы хранятся только до обновления этой вкладки. Для проверки оставьте отзыв
      на главной, затем вернитесь сюда.
    </p>
    <p v-if="kind === 'offline'" class="review-management__notice">
      База отзывов ещё не подключена. Приём отзывов и вход станут доступны после настройки сервера.
    </p>
    <p v-if="authLoading" role="status">Проверяем доступ…</p>
    <form
      v-else-if="kind === 'remote' && !isModerator"
      class="review-management__login"
      @submit.prevent="login"
    >
      <h3>Вход для Виктории</h3>
      <label
        >Электронная почта<input
          v-model="email"
          class="form-control"
          type="email"
          autocomplete="username"
          required
          :disabled="busy || adminLoading"
      /></label>
      <label
        >Пароль<input
          v-model="password"
          class="form-control"
          type="password"
          autocomplete="current-password"
          required
          :disabled="busy || adminLoading"
      /></label>
      <button class="btn btn-primary" type="submit" :disabled="busy || adminLoading">
        {{ busy ? 'Входим…' : 'Войти' }}
      </button>
    </form>
    <p v-if="error || adminError" role="alert" class="review-management__notice">
      {{ error || adminError }}
    </p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <template v-if="isModerator && !authLoading">
      <nav class="review-management__filters" aria-label="Статус отзывов">
        <button
          v-for="(label, key) in reviewStatusLabels"
          :key="key"
          type="button"
          :aria-pressed="status === key"
          :disabled="busy || adminLoading"
          @click="changeStatus(key)"
        >
          {{ label }}
        </button>
      </nav>
      <div class="review-management__toolbar">
        <span>{{ reviewStatusLabels[status] }} · {{ total }}</span>
        <div class="review-management__toolbar-actions">
          <button
            v-if="status === 'rejected' && total > 0"
            class="btn btn-outline-primary"
            type="button"
            :disabled="adminLoading || busy"
            @click="openClearConfirmation"
          >
            Очистить список
          </button>
          <button
            class="btn btn-link"
            type="button"
            :disabled="adminLoading || busy"
            @click="loadModeration()"
          >
            Обновить
          </button>
        </div>
      </div>
      <div ref="paginationTop" class="review-management__pages">
        <ReviewPagination
          v-if="pageCount > 1"
          :page="page"
          :page-count="pageCount"
          :total="total"
          :disabled="adminLoading || busy"
          label="Страницы отзывов сверху"
          @change="changePage"
        />
      </div>
      <p v-if="adminLoading && !moderation.length" role="status">Загружаем отзывы…</p>
      <p v-else-if="!moderation.length && !adminError" class="review-management__empty">
        Здесь пока нет отзывов.
      </p>
      <article v-for="review in moderation" :key="review.id" class="review-management__card">
        <header>
          <strong>{{ review.name }}</strong>
          <time :datetime="review.createdAt">{{ dateLabel(review.createdAt) }}</time>
        </header>
        <span class="review-management__stars" :aria-label="`${review.rating} из 5 звёзд`"
          >{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span
        >
        <p class="review-management__text">{{ review.text }}</p>
        <blockquote v-if="review.reply">
          <strong>Ответ администрации</strong>
          <p>{{ review.reply }}</p>
        </blockquote>
        <div class="review-management__actions">
          <button
            v-if="review.status === 'pending' || review.status === 'hidden'"
            class="btn btn-primary"
            type="button"
            :disabled="busy || adminLoading"
            @click="save(review, { status: 'published' })"
          >
            {{ review.status === 'hidden' ? 'Вернуть на сайт' : 'Опубликовать' }}
          </button>
          <button
            v-if="review.status === 'pending'"
            class="btn btn-outline-primary"
            type="button"
            :disabled="busy || adminLoading"
            @click="save(review, { status: 'rejected' })"
          >
            Отклонить
          </button>
          <button
            v-if="review.status === 'published'"
            class="btn btn-outline-primary"
            type="button"
            :disabled="busy || adminLoading"
            @click="save(review, { status: 'hidden' })"
          >
            Скрыть с сайта
          </button>
          <button
            v-if="review.status === 'rejected'"
            class="btn btn-outline-primary"
            type="button"
            :disabled="busy || adminLoading"
            @click="save(review, { status: 'pending' })"
          >
            Вернуть на проверку
          </button>
          <button
            class="btn btn-link"
            type="button"
            :disabled="busy || adminLoading"
            @click="startReply(review)"
          >
            {{ review.reply ? 'Изменить ответ' : 'Ответить' }}
          </button>
        </div>
        <form
          v-if="replyId === review.id"
          class="review-management__reply"
          @submit.prevent="save(review, { reply: replyText })"
        >
          <label :for="`reply-${review.id}`">Ответ администрации</label>
          <textarea
            :id="`reply-${review.id}`"
            v-model="replyText"
            class="form-control"
            rows="4"
            maxlength="1500"
            :disabled="busy || adminLoading"
          />
          <small
            >Ответ будет виден вместе с опубликованным отзывом. Чтобы убрать ответ, сохраните пустое
            поле.</small
          >
          <div class="review-management__actions">
            <button class="btn btn-primary" type="submit" :disabled="busy || adminLoading">
              Сохранить ответ
            </button>
            <button
              class="btn btn-link"
              type="button"
              :disabled="busy || adminLoading"
              @click="replyId = ''"
            >
              Отмена
            </button>
          </div>
        </form>
      </article>
      <ReviewPagination
        v-if="pageCount > 1 && moderation.length"
        :page="page"
        :page-count="pageCount"
        :total="total"
        :disabled="adminLoading || busy"
        label="Страницы отзывов снизу"
        @change="changePage"
      />
    </template>
    <MediaDialog
      :open="confirmClear"
      title="Очистить отклонённые отзывы?"
      class="review-management__confirm"
      @close="!busy && (confirmClear = false)"
    >
      <p>
        Будут удалены все отклонённые отзывы: {{ total }}, включая другие страницы. Восстановить их
        нельзя.
      </p>
      <p v-if="error" class="review-management__notice" role="alert">{{ error }}</p>
      <div class="review-management__actions">
        <button type="button" class="btn btn-primary" :disabled="busy" @click="clearRejected">
          {{ busy ? 'Удаляем…' : 'Удалить отклонённые' }}
        </button>
        <button
          type="button"
          class="btn btn-outline-primary"
          :disabled="busy"
          @click="confirmClear = false"
        >
          Отмена
        </button>
      </div>
    </MediaDialog>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import ReviewPagination from './ReviewPagination.vue';
import { MediaDialog } from '../../../shared/ui/index.ts';
import {
  useReviews,
  reviewStatusLabels,
  type Review,
  type ReviewStatus,
} from '../../../entities/review/index.ts';
const store = useReviews();
const {
  kind,
  isModerator,
  authLoading,
  adminLoading,
  adminError,
  moderation,
  status,
  page,
  total,
  pageCount,
  loadModeration,
} = store;
const email = ref('');
const password = ref('');
const busy = ref(false);
const error = ref('');
const notice = ref('');
const replyId = ref('');
const replyText = ref('');
const paginationTop = ref<HTMLElement | null>(null);
const confirmClear = ref(false);
watch(
  isModerator,
  (allowed) => {
    if (!allowed) confirmClear.value = false;
    replyId.value = '';
    replyText.value = '';
    if (allowed) void loadModeration();
  },
  { immediate: true },
);
async function run(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  notice.value = '';
  try {
    await action();
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'Не удалось выполнить действие.';
  } finally {
    busy.value = false;
  }
}
function login() {
  return run(async () => {
    await store.signIn(email.value, password.value);
    password.value = '';
  });
}
function logout() {
  return run(() => store.signOut());
}
function openClearConfirmation() {
  error.value = '';
  notice.value = '';
  confirmClear.value = true;
}
function clearRejected() {
  return run(async () => {
    const deleted = await store.clearRejected();
    confirmClear.value = false;
    replyId.value = '';
    replyText.value = '';
    notice.value = `Удалено отклонённых отзывов: ${deleted}.`;
  });
}
function changeStatus(next: ReviewStatus) {
  replyId.value = '';
  replyText.value = '';
  notice.value = '';
  void loadModeration(next, 1);
}
async function scrollToPagination() {
  await nextTick();
  paginationTop.value
    ?.querySelector<HTMLButtonElement>('[aria-current="page"]')
    ?.focus({ preventScroll: true });
  paginationTop.value?.scrollIntoView({ block: 'start', behavior: 'instant' });
}
async function changePage(next: number) {
  if (adminLoading.value || busy.value) return;
  replyId.value = '';
  replyText.value = '';
  notice.value = '';
  if (await loadModeration(status.value, next)) await scrollToPagination();
}
function startReply(review: Review) {
  replyId.value = review.id;
  replyText.value = review.reply;
}
function save(review: Review, patch: { status?: ReviewStatus; reply?: string }) {
  return run(async () => {
    const previousPage = page.value;
    await store.update(review, patch);
    replyId.value = '';
    replyText.value = '';
    notice.value = patch.reply !== undefined ? 'Ответ сохранён.' : 'Статус отзыва изменён.';
    if (page.value !== previousPage) await scrollToPagination();
  });
}
function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
</script>

<style scoped>
.review-management {
  max-width: 960px;
  margin-inline: auto;
}
.review-management__heading,
.review-management__card header,
.review-management__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.review-management h2 {
  margin: 0 0 8px;
  font-family: var(--display);
  font-size: 30px;
}
.review-management__heading {
  margin-bottom: 24px;
}
.review-management__heading p {
  margin: 0;
  max-width: 60ch;
}
.review-management__heading > button {
  flex-shrink: 0;
}
.review-management__heading p,
.review-management time,
.review-management small {
  color: var(--muted);
}
.review-management__notice,
.review-management__empty {
  margin: 0 0 20px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface-soft);
}
.review-management__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 20px;
}
.review-management__toolbar {
  margin-bottom: 16px;
}
.review-management__toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.review-management__confirm {
  width: min(520px, calc(100% - 24px));
}
.review-management__pages {
  scroll-margin-top: 16px;
}
.review-management__filters button {
  padding: 10px 14px;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--ink);
  background: var(--surface);
}
.review-management__filters button[aria-pressed='true'] {
  border-color: var(--accent);
  background: var(--selected-bg);
}
.review-management__card {
  display: grid;
  gap: 12px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface-raised);
  margin-bottom: 16px;
  overflow-wrap: anywhere;
}
.review-management__card header {
  align-items: baseline;
  gap: 8px 16px;
}
.review-management__card time {
  font-size: 14px;
}
.review-management__stars {
  display: block;
  color: var(--accent);
  font-size: 24px;
  letter-spacing: 3px;
  line-height: 1.25;
  margin: 0;
}
.review-management__text {
  margin: 0;
}
.review-management__text,
blockquote p {
  white-space: pre-wrap;
}
.review-management__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.review-management__actions .btn {
  width: auto;
}
blockquote {
  margin: 0;
  padding: 12px 16px;
  border-left: 2px solid var(--accent);
  background: var(--control-bg);
  border-radius: 0 12px 12px 0;
}
blockquote p {
  margin: 8px 0 0;
}
.review-management__login {
  display: grid;
  gap: 18px;
  max-width: 400px;
  margin-block: 24px;
}
.review-management__login label {
  display: grid;
  gap: 6px;
}
.review-management__login button {
  justify-self: start;
}
.review-management__reply {
  display: grid;
  gap: 10px;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.review-management__reply textarea {
  height: 128px;
  resize: none;
  overflow-y: auto;
}
@media (max-width: 575px) {
  .review-management__card {
    padding: 18px;
  }
  .review-management__filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .review-management__filters button {
    padding-inline: 8px;
    font-size: 14px;
  }
}
</style>
