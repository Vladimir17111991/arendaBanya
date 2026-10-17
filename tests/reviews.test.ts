import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReviewStore } from '../src/entities/review/model/store.ts';
import { createDemoReviewRepository } from '../src/entities/review/api/demo.ts';
import type { Review, ReviewRepository } from '../src/entities/review/model/types.ts';

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
  let resolveQueue!: (rows: Review[]) => void;
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
  resolveQueue([
    { ...draft, id: 'private', reply: '', status: 'pending', createdAt: '', updatedAt: '' },
  ]);
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
      return [];
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
