import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoGesture } from '../src/widgets/work-gallery/model/photoGesture.ts';
test('horizontal swipe is immediately followed by upward dismissal or background tap', () => {
  const g = createPhotoGesture();
  g.begin({ id: 1, x: 250, y: 200 });
  assert.equal(g.move({ id: 1, x: 100, y: 205 })?.axis, 'x');
  assert.equal(g.end({ id: 1, x: 50, y: 205 })?.axis, 'x');
  g.begin({ id: 2, x: 200, y: 300 });
  assert.deepEqual(g.end({ id: 2, x: 205, y: 100 }), { dx: 5, dy: -200, axis: 'y' });
  g.begin({ id: 3, x: 40, y: 100 });
  assert.deepEqual(g.end({ id: 3, x: 42, y: 102 }), { dx: 2, dy: 2, axis: null });
});
test('cancellation and a new gesture clear axis lock; unrelated pointers cannot move a slide', () => {
  const g = createPhotoGesture();
  g.begin({ id: 1, x: 0, y: 0 });
  assert.equal(g.move({ id: 2, x: 100, y: 0 }), null);
  g.move({ id: 1, x: 100, y: 0 });
  g.cancel();
  assert.equal(g.end({ id: 1, x: 100, y: 0 }), null);
  g.begin({ id: 3, x: 50, y: 200 });
  assert.equal(g.end({ id: 3, x: 50, y: 50 })?.axis, 'y');
});
