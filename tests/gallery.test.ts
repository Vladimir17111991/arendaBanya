import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPracticeStore,
  groupGalleryPhotos,
  sortGalleryPhotos,
} from '../src/entities/practice/index.ts';

test('photos accept multiple categories without a rental or a caption', () => {
  const store = createPracticeStore();
  store.switchProfile('victoria');
  const category = store.addCategory('Терраса');
  const selected = [category.id, 1, category.id];
  store.addPhoto({ categoryIds: selected, url: 'blob:terrace' });
  selected.length = 0;
  assert.deepEqual(store.photos.value[0].categoryIds, [1, category.id]);
  assert.equal(store.photos.value[0].title, 'Фото: Баня, Терраса');
  const groups = groupGalleryPhotos(store.categories.value, store.photos.value);
  assert.equal(groups[0].photos.length, 1);
  assert.equal(groups[2].photos.length, 1);
  assert.equal(sortGalleryPhotos(store.categories.value, store.photos.value).length, 1);
  store.renameCategory(category.id, 'Беседка');
  assert.equal(groupGalleryPhotos(store.categories.value, store.photos.value)[2].label, 'Беседка');
  store.removeCategory(category.id, 1);
  assert.deepEqual(store.photos.value[0].categoryIds, [1]);
  store.removeService(1);
  assert.equal(store.photos.value.length, 1);
  assert.throws(() => store.removeCategory(1), /другую категорию/);
  store.dispose();
});

test('gallery sorting follows category order without duplicating shared photos or mutating input', () => {
  const categories = [
    { id: 1, name: 'Почасовая аренда' },
    { id: 2, name: 'Посуточная аренда' },
    { id: 3, name: 'Сад' },
  ];
  const photos = [
    { id: 'garden', categoryIds: [3] },
    { id: 'bedroom', categoryIds: [2] },
    { id: 'shared', categoryIds: [1, 2] },
    { id: 'bath', categoryIds: [1] },
  ];
  assert.deepEqual(
    sortGalleryPhotos(categories, photos).map((photo) => photo.id),
    ['shared', 'bath', 'bedroom', 'garden'],
  );
  assert.equal(photos[0].id, 'garden');
  assert.deepEqual(
    groupGalleryPhotos(categories, photos).map((group) => [group.label, group.photos.length]),
    [
      ['Баня', 2],
      ['Спальня', 2],
      ['Сад', 1],
    ],
  );
});
