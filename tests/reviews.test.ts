import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReviewStore } from '../src/entities/review/model/store.ts';
import { createDemoReviewRepository } from '../src/entities/review/api/demo.ts';
import type { ReviewPage, ReviewRepository } from '../src/entities/review/model/types.ts';

const draft = { name: ' Гость ', rating: 2, text: ' Хотелось бы больше полотенец. ' };

test('review stays private until approved; reply, hide, restore and reject preserve the original opinion', async () => {
  const store = createReviewStore(createDemoReviewRepository());
  await store.init();
  await store.submit('new-review', draft);
  await store.submit('new-review', draft);
  await store.refreshPublic();
  assert.equal(
    store.published.value.some((review) => review.id === 'new-review'),
    false,
  );
  await store.loadModeration('pending');
  assert.equal(store.moderation.value.length, 1);
  const pending = store.moderation.value[0];
  await store.update(pending, { reply: 'Спасибо, учтём пожелание.', status: 'published' });
  const published = store.published.value.find((review) => review.id === 'new-review')!;
  assert.equal(published.text, draft.text.trim());
  assert.equal(published.rating, 2);
  assert.equal(published.reply, 'Спасибо, учтём пожелание.');
  await assert.rejects(store.update(pending, { status: 'rejected' }), /уже изменён/);
  await store.update(published, { status: 'hidden' });
  assert.equal(
    store.published.value.some((review) => review.id === 'new-review'),
    false,
  );
  await store.loadModeration('hidden');
  await store.update(store.moderation.value[0], { status: 'published' });
  assert.equal(store.published.value.find((review) => review.id === 'new-review')?.rating, 2);
  await store.submit('another', draft);
  await store.loadModeration('pending');
  await store.update(store.moderation.value[0], { status: 'rejected' });
  await store.loadModeration('rejected');
  await store.update(store.moderation.value[0], { status: 'pending' });
  await store.loadModeration('pending');
  assert.equal(store.moderation.value[0]?.id, 'another');
  store.dispose();
});

test('offline mode never reports a successful submission; invalid data does not enter the queue', async () => {
  const offline = createReviewStore();
  assert.equal(offline.canSubmit.value, false);
  await assert.rejects(offline.submit('id', draft), /не отправлен/);
  const store = createReviewStore(createDemoReviewRepository());
  await store.init();
  for (const invalid of [
    { ...draft, name: ' ' },
    { ...draft, rating: 0 },
    { ...draft, rating: 2.5 },
    { ...draft, text: 'Short' },
    { ...draft, text: 'a'.repeat(1501) },
  ]) {
    await assert.rejects(store.submit('invalid', invalid));
  }
  await store.loadModeration();
  assert.deepEqual(store.moderation.value, []);
  store.dispose();
});

test('private queue response arriving after sign-out cannot repopulate the cabinet', async () => {
  let resolveQueue!: (result: ReviewPage) => void;
  const base = createDemoReviewRepository();
  const repository: ReviewRepository = {
    ...base,
    listModeration: () =>
      new Promise((resolve) => {
        resolveQueue = resolve;
      }),
  };
  const store = createReviewStore(repository);
  await store.init();
  const loading = store.loadModeration();
  await store.signOut();
  resolveQueue({
    reviews: [
      { ...draft, id: 'private', reply: '', status: 'pending', createdAt: '', updatedAt: '' },
    ],
    total: 1,
  });
  await loading;
  assert.deepEqual(store.moderation.value, []);
  assert.equal(store.isModerator.value, false);
  assert.equal(store.adminLoading.value, false);
  await assert.rejects(
    store.update(
      { ...draft, id: 'private', reply: '', status: 'pending', createdAt: '', updatedAt: '' },
      { status: 'published' },
    ),
    /Войдите/,
  );
  store.dispose();
});

test('ordinary signed-in account cannot load moderation or change reviews', async () => {
  let reads = 0;
  let writes = 0;
  const repository: ReviewRepository = {
    ...createDemoReviewRepository(),
    async isModerator() {
      return false;
    },
    async listModeration() {
      reads++;
      return { reviews: [], total: 0 };
    },
    async update() {
      writes++;
    },
  };
  const store = createReviewStore(repository);
  await store.init();
  await store.loadModeration();
  await assert.rejects(store.update(store.published.value[0], { status: 'hidden' }));
  assert.equal(reads, 0);
  assert.equal(writes, 0);
  store.dispose();
});

test('a permission check completing after sign-out cannot restore access', async () => {
  let resolvePermission!: (allowed: boolean) => void;
  const store = createReviewStore({
    ...createDemoReviewRepository(),
    isModerator: () =>
      new Promise((resolve) => {
        resolvePermission = resolve;
      }),
  });
  const pending = store.refreshAuth();
  await store.signOut();
  resolvePermission(true);
  await pending;
  assert.equal(store.isModerator.value, false);
  assert.equal(store.authLoading.value, false);
  store.dispose();
});

test('a failed public refresh clears stale reviews instead of leaving a hidden review visible', async () => {
  const base = createDemoReviewRepository();
  let failing = false;
  const store = createReviewStore({
    ...base,
    async listPublic() {
      if (failing) throw new Error('offline');
      return base.listPublic();
    },
  });
  await store.init();
  assert.equal(store.published.value.length, 3);
  failing = true;
  await store.refreshPublic();
  assert.deepEqual(store.published.value, []);
  assert.equal(store.publicError.value, 'offline');
  store.dispose();
});

async function paginationFixture(count: number) {
  const repository = createDemoReviewRepository();
  for (let index = 1; index <= count; index++) await repository.submit(`review-${index}`, draft);
  const store = createReviewStore(repository);
  await store.init();
  await store.loadModeration();
  return { store, repository };
}

test('moderation pages replace ten rows, navigate both ways and reset on status change', async () => {
  const { store } = await paginationFixture(23);
  assert.equal(store.total.value, 23);
  assert.equal(store.pageCount.value, 3);
  assert.equal(store.moderation.value.length, 10);
  const firstPageIds = store.moderation.value.map((row) => row.id);
  await store.loadModeration('pending', 2);
  assert.equal(store.page.value, 2);
  assert.equal(store.moderation.value.length, 10);
  assert.ok(store.moderation.value.every((row) => !firstPageIds.includes(row.id)));
  const secondPageIds = store.moderation.value.map((row) => row.id);
  await store.loadModeration();
  assert.equal(store.page.value, 2);
  assert.deepEqual(
    store.moderation.value.map((row) => row.id),
    secondPageIds,
  );
  await store.loadModeration('pending', 3);
  assert.equal(store.moderation.value.length, 3);
  await store.loadModeration('pending', 1);
  assert.deepEqual(
    store.moderation.value.map((row) => row.id),
    firstPageIds,
  );
  await store.loadModeration('pending', 3);
  await store.loadModeration('published');
  assert.equal(store.page.value, 1);
  assert.equal(store.total.value, 3);
  assert.equal(store.pageCount.value, 1);
  await store.signOut();
  assert.equal(store.total.value, 0);
  assert.equal(store.page.value, 1);
  store.dispose();
});

test('reply preserves the page; moderating the last row returns to the preceding page', async () => {
  const { store } = await paginationFixture(21);
  await store.loadModeration('pending', 3);
  await store.update(store.moderation.value[0], { reply: 'Спасибо за ваш отзыв.' });
  assert.equal(store.page.value, 3);
  assert.equal(store.moderation.value[0].reply, 'Спасибо за ваш отзыв.');
  await store.update(store.moderation.value[0], { status: 'published' });
  assert.equal(store.page.value, 2);
  assert.equal(store.pageCount.value, 2);
  assert.equal(store.total.value, 20);
  assert.equal(store.moderation.value.length, 10);
  store.dispose();
});

test('refresh recovers when other moderators empty pages or the entire queue', async () => {
  const { store, repository } = await paginationFixture(21);
  await store.loadModeration('pending', 3);
  const rows = (await repository.listModeration('pending', 10)).reviews;
  const last = (await repository.listModeration('pending', 20)).reviews;
  for (const row of [...rows, ...last]) await repository.update(row, { status: 'rejected' });
  await store.loadModeration();
  assert.equal(store.page.value, 1);
  assert.equal(store.total.value, 10);
  for (const row of store.moderation.value) await repository.update(row, { status: 'rejected' });
  await store.loadModeration();
  assert.equal(store.page.value, 1);
  assert.equal(store.total.value, 0);
  assert.deepEqual(store.moderation.value, []);
  store.dispose();
});

test('a failed page request preserves the displayed page and can be retried', async () => {
  const { repository } = await paginationFixture(12);
  let fail = false;
  const store = createReviewStore({
    ...repository,
    async listModeration(status, offset) {
      if (fail) throw new Error('offline');
      return repository.listModeration(status, offset);
    },
  });
  await store.init();
  await store.loadModeration();
  const original = store.moderation.value.map((row) => row.id);
  fail = true;
  await store.loadModeration('pending', 2);
  assert.equal(store.page.value, 1);
  assert.equal(store.adminError.value, 'offline');
  assert.deepEqual(
    store.moderation.value.map((row) => row.id),
    original,
  );
  fail = false;
  await store.loadModeration('pending', 2);
  assert.equal(store.page.value, 2);
  assert.equal(store.moderation.value.length, 2);
  store.dispose();
});

test('a delayed page cannot overwrite a newer status selection', async () => {
  const { repository } = await paginationFixture(12);
  let resolvePage!: (result: ReviewPage) => void;
  const store = createReviewStore({
    ...repository,
    listModeration(status, offset) {
      if (status === 'pending' && offset === 10)
        return new Promise((resolve) => {
          resolvePage = resolve;
        });
      return repository.listModeration(status, offset);
    },
  });
  await store.init();
  await store.loadModeration();
  const pending = store.loadModeration('pending', 2);
  await store.loadModeration('published');
  resolvePage(await repository.listModeration('pending', 10));
  await pending;
  assert.equal(store.status.value, 'published');
  assert.equal(store.page.value, 1);
  assert.equal(store.total.value, 3);
  assert.ok(store.moderation.value.every((row) => row.status === 'published'));
  store.dispose();
});
