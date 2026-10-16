import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useEstimateDrawer } from '../src/widgets/public-availability/model/useEstimateDrawer.ts';

test('manual collapse survives repeated price updates and can be expanded again', () => {
  const drawer = useEstimateDrawer();
  drawer.reveal(true);
  assert.equal(drawer.visible.value, true);
  assert.equal(drawer.expanded.value, true);
  drawer.open();
  drawer.open();
  assert.equal(drawer.expanded.value, true);
  drawer.toggle();
  drawer.reveal(true);
  drawer.reveal(true);
  assert.equal(drawer.expanded.value, false);
  drawer.toggle();
  assert.equal(drawer.expanded.value, true);
});

test('choosing a date reveals the total without interrupting the calendar', () => {
  const drawer = useEstimateDrawer();
  drawer.reveal();
  assert.equal(drawer.visible.value, true);
  assert.equal(drawer.expanded.value, false);
  drawer.reveal(true);
  assert.equal(drawer.expanded.value, true);
});

test('closing or changing the rental resets the drawer for the next calculation', () => {
  const drawer = useEstimateDrawer();
  drawer.reveal(true);
  drawer.toggle();
  drawer.reset();
  assert.equal(drawer.visible.value, false);
  assert.equal(drawer.expanded.value, false);
  drawer.reveal(true);
  assert.equal(drawer.expanded.value, true);
});
