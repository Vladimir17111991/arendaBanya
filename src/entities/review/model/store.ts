import { computed, inject, provide, readonly, ref, type InjectionKey } from 'vue';
import { canChangeReviewStatus, prepareReview, REVIEW_PAGE_SIZE } from './types.ts';
import type { Review, ReviewDraft, ReviewRepository, ReviewStatus } from './types.ts';

export function createReviewStore(repository?: ReviewRepository) {
  const kind = repository?.kind ?? 'offline';
  const published = ref<Review[]>([]);
  const moderation = ref<Review[]>([]);
  const isModerator = ref(false);
  const authLoading = ref(false);
  const publicLoading = ref(false);
  const publicError = ref('');
  const adminError = ref('');
  const adminLoading = ref(false);
  const status = ref<ReviewStatus>('pending');
  const hasMore = ref(false);
  let authVersion = 0;
  let listVersion = 0;
  let publicVersion = 0;
  let disposed = false;
  function clearPrivate() {
    ++listVersion;
    moderation.value = [];
    hasMore.value = false;
    adminLoading.value = false;
    authLoading.value = false;
    isModerator.value = false;
  }
  async function refreshPublic() {
    if (!repository) return;
    const version = ++publicVersion;
    publicLoading.value = true;
    publicError.value = '';
    try {
      const data = await repository.listPublic();
      if (version === publicVersion)
        published.value = data.filter((row) => row.status === 'published');
    } catch (error) {
      if (version === publicVersion) {
        published.value = [];
        publicError.value = message(error);
      }
    } finally {
      if (version === publicVersion) publicLoading.value = false;
    }
  }
  async function refreshAuth() {
    if (!repository || disposed) return;
    const version = ++authVersion;
    clearPrivate();
    authLoading.value = true;
    adminError.value = '';
    try {
      const allowed = await repository.isModerator();
      if (version === authVersion) isModerator.value = allowed;
    } catch (error) {
      if (version === authVersion) adminError.value = message(error);
    } finally {
      if (version === authVersion) authLoading.value = false;
    }
  }
  async function loadModeration(nextStatus = status.value, more = false) {
    if (!repository || !isModerator.value) return;
    const version = ++listVersion;
    const offset = more && nextStatus === status.value ? moderation.value.length : 0;
    status.value = nextStatus;
    if (!offset) moderation.value = [];
    adminLoading.value = true;
    adminError.value = '';
    try {
      const data = await repository.listModeration(nextStatus, offset);
      if (version !== listVersion || !isModerator.value) return;
      moderation.value = offset ? [...moderation.value, ...data] : data;
      hasMore.value = data.length === REVIEW_PAGE_SIZE;
    } catch (error) {
      if (version === listVersion) adminError.value = message(error);
    } finally {
      if (version === listVersion) adminLoading.value = false;
    }
  }
  async function submit(id: string, draft: ReviewDraft) {
    if (!repository) throw new Error('Приём отзывов ещё не подключён. Отзыв не отправлен.');
    await repository.submit(id, prepareReview(draft));
  }
  async function update(review: Review, patch: { status?: ReviewStatus; reply?: string }) {
    if (!repository || !isModerator.value) throw new Error('Войдите в аккаунт Виктории.');
    if (patch.status && !canChangeReviewStatus(review.status, patch.status))
      throw new Error('Недопустимое изменение статуса.');
    if (patch.reply !== undefined) {
      patch = { ...patch, reply: patch.reply.trim() };
      if (patch.reply!.length > 1500)
        throw new Error('Ответ должен быть не длиннее 1500 символов.');
    }
    await repository.update(review, patch);
    await Promise.all([refreshPublic(), loadModeration()]);
  }
  async function signIn(email: string, password: string) {
    if (!repository) return;
    adminError.value = '';
    await repository.signIn(email, password);
    await refreshAuth();
    if (!isModerator.value) throw new Error('У этого аккаунта нет прав на модерацию отзывов.');
  }
  async function signOut() {
    ++authVersion;
    clearPrivate();
    await repository?.signOut();
  }
  const unsubscribe = repository?.onAuthChange(() => {
    void refreshAuth();
  });
  return {
    kind,
    published: readonly(published),
    moderation: readonly(moderation),
    isModerator: readonly(isModerator),
    authLoading: readonly(authLoading),
    publicLoading: readonly(publicLoading),
    publicError: readonly(publicError),
    adminLoading: readonly(adminLoading),
    adminError: readonly(adminError),
    status: readonly(status),
    hasMore: readonly(hasMore),
    canSubmit: computed(() => Boolean(repository)),
    refreshPublic,
    refreshAuth,
    loadModeration,
    submit,
    update,
    signIn,
    signOut,
    async init() {
      await Promise.all([refreshPublic(), refreshAuth()]);
    },
    dispose() {
      disposed = true;
      ++authVersion;
      ++publicVersion;
      clearPrivate();
      unsubscribe?.();
    },
  };
}

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить действие. Попробуйте ещё раз.';
}
export type ReviewStore = ReturnType<typeof createReviewStore>;
const reviewKey: InjectionKey<ReviewStore> = Symbol('reviews');
export function provideReviews(store: ReviewStore) {
  provide(reviewKey, store);
}
export function useReviews() {
  const store = inject(reviewKey);
  if (!store) throw new Error('Reviews are not provided');
  return store;
}
