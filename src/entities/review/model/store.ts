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
  const page = ref(1);
  const total = ref(0);
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / REVIEW_PAGE_SIZE)));
  let authVersion = 0;
  let listVersion = 0;
  let publicVersion = 0;
  let disposed = false;
  function clearPrivate() {
    ++listVersion;
    moderation.value = [];
    page.value = 1;
    total.value = 0;
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
  async function loadModeration(
    nextStatus = status.value,
    targetPage = nextStatus === status.value ? page.value : 1,
  ) {
    if (!repository || !isModerator.value) return;
    const version = ++listVersion;
    let requested = Number.isSafeInteger(targetPage) ? Math.max(1, targetPage) : 1;
    if (nextStatus !== status.value) {
      moderation.value = [];
      total.value = 0;
      page.value = 1;
    }
    status.value = nextStatus;
    adminLoading.value = true;
    adminError.value = '';
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await repository.listModeration(
          nextStatus,
          (requested - 1) * REVIEW_PAGE_SIZE,
        );
        if (version !== listVersion || !isModerator.value) return;
        const lastPage = Math.max(1, Math.ceil(result.total / REVIEW_PAGE_SIZE));
        if (requested > lastPage) {
          requested = lastPage;
          continue;
        }
        moderation.value = result.reviews;
        total.value = result.total;
        page.value = requested;
        return true;
      }
      throw new Error('Список отзывов изменился. Обновите страницу отзывов.');
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
    page: readonly(page),
    total: readonly(total),
    pageCount,
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
