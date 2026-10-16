import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeSectionAt, navigationSection } from '../src/app/model/activeSection.ts';

test('the availability wrapper cannot clear the active price navigation link', () => {
  assert.equal(navigationSection('availability'), 'price-list');
  assert.equal(
    activeSectionAt(
      [
        { section: 'home', top: -1900 },
        { section: 'work-gallery', top: -1200 },
        { section: 'price-list', top: 130 },
        { section: 'availability', top: 130 },
        { section: 'contacts', top: 1800 },
      ],
      240,
    ),
    'price-list',
  );
});

test('active navigation follows visual section order, including scrolling back', () => {
  assert.equal(
    activeSectionAt(
      [
        { section: 'price-list', top: 900 },
        { section: 'home', top: -700 },
        { section: 'work-gallery', top: 120 },
      ],
      240,
    ),
    'work-gallery',
  );
  assert.equal(activeSectionAt([{ section: 'work-gallery', top: 500 }], 240), 'home');
  assert.equal(activeSectionAt([{ section: 'price-list', top: -500 }], 240, true), 'contacts');
});
