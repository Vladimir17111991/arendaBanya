import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewLoopPosition, reviewSwipeTarget } from '../src/widgets/reviews/model/reviewLoop.ts';

test('reviews keep moving through both ends over repeated swipes', () => {
  for (const direction of [-1, 1]) {
    let position = 3;
    const seen: number[] = [];
    for (let swipe = 0; swipe < 9; swipe++) {
      const end = position + direction * 0.2;
      position = reviewLoopPosition(reviewSwipeTarget(position, end, 360, 0), 3);
      seen.push(position - 3);
      assert.ok(position >= 3 && position < 6, 'always leaves room for the next swipe');
    }
    assert.deepEqual(
      seen,
      direction > 0 ? [1, 2, 0, 1, 2, 0, 1, 2, 0] : [2, 1, 0, 2, 1, 0, 2, 1, 0],
    );
  }
});

test('rebasing a long drag preserves the visible review and partial movement', () => {
  assert.equal(reviewLoopPosition(-4.25, 3), 4.75);
  assert.equal(reviewLoopPosition(13.25, 3), 4.25);
  const end = -4.25;
  const release = reviewSwipeTarget(3, end, 360, 0);
  const visualTarget = reviewLoopPosition(end, 3) + release - end;
  assert.equal(reviewLoopPosition(visualTarget, 3), 5);
});

test('a small accidental drag returns, while a quick flick advances', () => {
  assert.equal(reviewSwipeTarget(3, 3.03, 360, 0), 3);
  assert.equal(reviewSwipeTarget(3, 3.15, 360, 0), 4);
  assert.equal(reviewSwipeTarget(3, 3.08, 360, 1.1), 4);
  assert.equal(reviewSwipeTarget(3, 2.92, 360, -1.1), 2);
  assert.equal(reviewSwipeTarget(3, 4.1, 360, 0), 4);
});
