import { canChangeReviewStatus, prepareReview, REVIEW_PAGE_SIZE } from '../model/types.ts';
import type { Review, ReviewRepository } from '../model/types.ts';

export function createDemoReviewRepository(): ReviewRepository {
  const stamp = new Date().toISOString();
  const rows: Review[] = [
    {
      id: 'example-anna',
      name: 'Анна',
      rating: 5,
      text: 'Тихий вечер, тёплая парная и возможность никуда не спешить. Именно такой отдых хотелось устроить.',
      status: 'published',
      reply: '',
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: 'example-dmitry',
      name: 'Дмитрий',
      rating: 4,
      text: 'Приехали небольшой компанией. Хорошо попарились и спокойно провели время вместе.',
      status: 'published',
      reply: '',
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: 'example-elena',
      name: 'Елена',
      rating: 5,
      text: 'Удобно остаться с ночёвкой после бани — отдохнуть и уехать уже утром.',
      status: 'published',
      reply: '',
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
  return {
    kind: 'demo',
    async listPublic() {
      return rows.filter((row) => row.status === 'published').map((row) => ({ ...row }));
    },
    async listModeration(status, offset) {
      const matching = rows.filter((row) => row.status === status);
      return {
        reviews: matching.slice(offset, offset + REVIEW_PAGE_SIZE).map((row) => ({ ...row })),
        total: matching.length,
      };
    },
    async submit(id, draft) {
      if (rows.some((row) => row.id === id)) return;
      const now = new Date().toISOString();
      rows.unshift({
        ...prepareReview(draft),
        id,
        status: 'pending',
        reply: '',
        createdAt: now,
        updatedAt: now,
      });
    },
    async update(review, patch) {
      const row = rows.find((item) => item.id === review.id);
      if (!row || row.updatedAt !== review.updatedAt)
        throw new Error('Отзыв уже изменён. Обновите список.');
      if (patch.status && !canChangeReviewStatus(row.status, patch.status))
        throw new Error('Недопустимое изменение статуса.');
      if (patch.reply && patch.reply.length > 1500)
        throw new Error('Ответ должен быть не длиннее 1500 символов.');
      Object.assign(row, patch, {
        updatedAt: new Date(Math.max(Date.now(), Date.parse(row.updatedAt) + 1)).toISOString(),
      });
    },
    async isModerator() {
      return true;
    },
    async signIn() {},
    async signOut() {},
    onAuthChange() {
      return () => {};
    },
  };
}
