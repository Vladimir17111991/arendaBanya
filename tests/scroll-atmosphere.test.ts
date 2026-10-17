import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  atmosphereAt,
  atmosphereStages,
  sectionLayoutTop,
} from '../src/pages/home/model/scrollAtmosphere.ts';

test('background crosses the pricing boundary continuously in either scroll direction', () => {
  assert.deepEqual(
    atmosphereStages.map(({ id }) => id),
    ['home', 'work-gallery', 'price-list', 'contacts'],
  );
  const stops = atmosphereStages.map((stage, index) => ({ stage, top: index * 1000 }));
  for (const top of [1000, 2000, 3000]) {
    const before = atmosphereAt(stops, top - 0.001);
    const after = atmosphereAt(stops, top + 0.001);
    for (const key of Object.keys(before) as (keyof typeof before)[])
      assert.ok(Math.abs(before[key] - after[key]) < 0.0001, `${key} must not jump at ${top}`);
  }
});

test('section measurements ignore reveal transforms and clamp at the page ends', () => {
  const parent = { offsetTop: 1200, offsetParent: null };
  const section = {
    offsetTop: 96,
    offsetParent: parent,
    getBoundingClientRect: () => {
      throw new Error('Reveal transforms must not affect layout');
    },
  };
  assert.equal(sectionLayoutTop(section as unknown as HTMLElement), 1296);
  const stops = atmosphereStages.map((stage, index) => ({ stage, top: index * 1000 }));
  assert.deepEqual(atmosphereAt(stops, -100), atmosphereAt(stops, 0));
  assert.deepEqual(atmosphereAt(stops, 5000), atmosphereAt(stops, 3000));
});
