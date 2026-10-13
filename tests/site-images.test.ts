import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeStore } from '../src/entities/practice/index.ts';
import { validateImageFile, isHeicImage } from '../src/shared/lib/image-upload/index.ts';

const seed = {
  hero: { url: '/portrait.jpg', width: 1200, height: 1600, isDemo: true },
  studio: { url: '/studio.jpg', width: 1600, height: 1200, isDemo: true },
};

test('site photos keep natural dimensions, replace independently and release owned URLs', (context) => {
  const revoked: string[] = [];
  context.mock.method(URL, 'revokeObjectURL', (url: string) => revoked.push(url));
  const store = createPracticeStore(undefined, { siteImages: seed });
  store.switchProfile('victoria');
  const image = { url: 'blob:portrait', width: 3024, height: 4032 };
  store.setSiteImage('hero', image);
  image.width = 1;
  assert.equal(store.siteImages.value.hero?.width, 3024);
  assert.equal(store.siteImages.value.hero?.height, 4032);
  assert.equal(store.siteImages.value.hero?.isDemo, undefined);
  assert.deepEqual(store.siteImages.value.studio, seed.studio);
  assert.deepEqual(revoked, []);
  store.setSiteImage('hero', { url: 'blob:portrait-2', width: 4000, height: 3000 });
  assert.deepEqual(revoked, ['blob:portrait']);
  store.removeSiteImage('hero');
  assert.equal(store.siteImages.value.hero, null);
  assert.deepEqual(revoked, ['blob:portrait', 'blob:portrait-2']);
  store.setSiteImage('studio', { url: 'blob:office', width: 3000, height: 4000 });
  store.dispose();
  store.dispose();
  assert.deepEqual(revoked, ['blob:portrait', 'blob:portrait-2', 'blob:office']);
  assert.deepEqual(seed.hero, { url: '/portrait.jpg', width: 1200, height: 1600, isDemo: true });
});

test('invalid or unauthorized changes preserve published site photos', () => {
  const store = createPracticeStore(undefined, { siteImages: seed });
  const secondStore = createPracticeStore(undefined, { siteImages: seed });
  for (const actor of ['guest']) {
    store.switchProfile(actor);
    assert.throws(
      () => store.setSiteImage('hero', { url: 'blob:unauthorized', width: 1, height: 1 }),
      /только Виктории/,
    );
    assert.throws(() => store.removeSiteImage('studio'), /только Виктории/);
  }
  store.switchProfile('victoria');
  assert.throws(
    () => store.setSiteImage('hero', { url: 'https://example.com/photo.jpg', width: 1, height: 1 }),
    /с устройства/,
  );
  assert.throws(
    () => store.setSiteImage('hero', { url: 'blob:invalid', width: 0, height: 4000 }),
    /размер/,
  );
  assert.deepEqual(store.siteImages.value, seed);
  store.removeSiteImage('hero');
  store.removeSiteImage('studio');
  assert.deepEqual(store.siteImages.value, { hero: null, studio: null });
  assert.deepEqual(secondStore.siteImages.value, seed);
});

test('phone upload validation accepts camera files and reports unsupported or oversized inputs', () => {
  assert.equal(
    validateImageFile({ name: 'IMG_1234.JPG', type: 'image/jpeg', size: 12 * 1024 * 1024 }),
    '',
  );
  assert.equal(validateImageFile({ name: 'IMG_1234.HEIC', type: '', size: 10 }), '');
  assert.equal(validateImageFile({ name: 'photo.heif', type: 'image/heif', size: 10 }), '');
  assert.equal(isHeicImage({ name: 'IMG_1234.HEIC', type: '', size: 10 }), true);
  assert.match(
    validateImageFile({ name: 'photo.jpg', type: 'image/svg+xml', size: 10 }),
    /Выберите фото/,
  );
  assert.match(
    validateImageFile({ name: 'photo.jpg', type: 'image/jpeg', size: 21 * 1024 * 1024 }),
    /до 20 МБ/,
  );
  assert.match(validateImageFile({ name: 'photo.jpg', type: 'image/jpeg', size: 0 }), /пустой/);
});
