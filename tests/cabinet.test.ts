import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectScope, nextTick } from 'vue';
import {
  monthDates,
  weekDates,
  adjacentMonth,
  createPracticeStore,
} from '../src/entities/practice/index.ts';
import { createNavigation } from '../src/app/model/navigation.ts';
import { useBookingForm } from '../src/features/book-appointment/model.ts';

test('calendar handles Sunday, year boundaries, and leap February without timezone drift', () => {
  assert.deepEqual(weekDates('2026-01-04'), [
    '2025-12-29',
    '2025-12-30',
    '2025-12-31',
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
    '2026-01-04',
  ]);
  const february = monthDates('2028-02-29');
  assert.equal(february.length, 42);
  assert.equal(new Set(february).size, 42);
  assert.equal(february[0], '2028-01-31');
  assert.equal(february.filter((date) => date.startsWith('2028-02')).length, 29);
  assert.equal(adjacentMonth('2026-01-31', 1), '2026-02-01');
  assert.equal(adjacentMonth('2026-01-31', -1), '2025-12-01');
});

test('client shortcut preselects a visible available day, keeps it on service change, and resets the next form', async () => {
  const store = createPracticeStore(() => new Date('2030-01-08T06:00:00Z'));
  store.switchProfile('victoria');
  const client = store.addClient('Анна', '+375290000001');
  const navigation = createNavigation(() => store.isGuest.value);
  navigation.navigate('booking', {
    reset: true,
    booking: { clientId: client.id, date: '2030-02-01' },
  });
  const scope = effectScope();
  try {
    const form = scope.run(() => useBookingForm(store, navigation.bookingPrefill.value))!;
    assert.equal(form.bookingClient.value?.id, client.id);
    assert.equal(form.date.value, '2030-02-01');
    assert.ok(form.visibleDays.value.includes(form.date.value));
    store.selectService(store.services.value[1]);
    await nextTick();
    assert.equal(form.date.value, '2030-02-01');
    form.time.value = '11:00';
    form.submit();
    assert.equal(form.success.value?.clientId, client.id);
    assert.equal(form.success.value?.date, '2030-02-01');
    navigation.navigate('booking', { reset: true });
    assert.deepEqual(navigation.bookingPrefill.value, {});
    store.switchProfile('guest');
    navigation.navigate('booking', { reset: true, booking: { clientId: 'maria' } });
    assert.deepEqual(navigation.bookingPrefill.value, {});
  } finally {
    scope.stop();
  }
});

test('closed or out-of-range prefilled dates and missing clients cannot bypass booking rules', () => {
  const store = createPracticeStore(() => new Date('2030-01-08T06:00:00Z'));
  store.switchProfile('victoria');
  store.toggleDayOff(0);
  const scope = effectScope();
  try {
    for (const date of ['2030-01-13', '2029-12-31', '2031-01-08']) {
      const form = scope.run(() => useBookingForm(store, { clientId: 'missing', date }))!;
      assert.notEqual(form.date.value, date);
      assert.ok(form.visibleDays.value.includes(form.date.value));
      assert.equal(form.bookingClient.value, undefined);
      assert.equal(form.canSubmit.value, false);
    }
  } finally {
    scope.stop();
  }
});

test('manual form reserves the requested hours and days and clears conflicting start times', async () => {
  const store = createPracticeStore(() => new Date('2030-01-08T06:00:00Z'));
  store.switchProfile('victoria');
  const client = store.addClient('Ирина', '+375290000002');
  const scope = effectScope();
  try {
    const form = scope.run(() =>
      useBookingForm(store, { clientId: client.id, date: '2030-02-01' }),
    )!;
    form.quantity.value = 3;
    form.guestCount.value = 4;
    await nextTick();
    assert.equal(form.totalPrice.value, 240);
    form.time.value = '11:00';
    form.submit();
    assert.equal(form.success.value?.service.duration, 180);
    assert.equal(form.success.value?.guestCount, 4);
    assert.equal(form.success.value?.unitPrice, 20);
    assert.equal(form.success.value?.service.price, 240);
    form.reset();
    assert.equal(form.guestCount.value, 1);
    form.customer.value = { mode: 'existing', clientId: client.id };
    store.selectService(store.services.value[1]);
    await nextTick();
    form.quantity.value = 2;
    form.guestCount.value = 3;
    form.selectDate('2030-02-03');
    await nextTick();
    form.time.value = '12:00';
    assert.equal(form.totalPrice.value, 480);
    form.submit();
    assert.equal(form.success.value?.service.duration, 2880);
    assert.equal(form.success.value?.quantity, 2);
    assert.equal(form.success.value?.guestCount, 3);
    assert.equal(form.success.value?.service.price, 480);
    form.reset();
    form.quantity.value = 0;
    await nextTick();
    assert.equal(form.canSubmit.value, false);
    assert.equal(form.availableTimes.value.length, 0);
  } finally {
    scope.stop();
  }
});

test('guest count changes the price without changing availability and rejects invalid counts', async () => {
  const store = createPracticeStore(() => new Date('2030-01-08T06:00:00Z'));
  store.switchProfile('victoria');
  const client = store.addClient('Ирина', '+375290000002');
  const scope = effectScope();
  try {
    const form = scope.run(() =>
      useBookingForm(store, { clientId: client.id, date: '2030-02-01' }),
    )!;
    form.quantity.value = 2;
    await nextTick();
    form.time.value = '10:00';
    const slots = [...form.availableTimes.value];
    form.guestCount.value = 5;
    assert.equal(form.totalPrice.value, 200);
    assert.equal(form.canSubmit.value, true);
    assert.deepEqual(form.availableTimes.value, slots);
    for (const value of [0, -1, 1.5, 31, Number.NaN]) {
      form.guestCount.value = value;
      assert.equal(form.canSubmit.value, false);
      assert.equal(form.totalPrice.value, null);
    }
  } finally {
    scope.stop();
  }
});

test('hourly quantity is limited by the working day before availability watchers run', async () => {
  const store = createPracticeStore(() => new Date('2030-01-08T06:00:00Z'));
  store.switchProfile('victoria');
  const client = store.addClient('Ирина', '+375290000002');
  const scope = effectScope();
  try {
    const form = scope.run(() =>
      useBookingForm(store, { clientId: client.id, date: '2030-02-01' }),
    )!;
    assert.equal(form.maxQuantity.value, 9);
    form.quantity.value = 9;
    await nextTick();
    form.time.value = '10:00';
    assert.equal(form.canSubmit.value, true);
    form.quantity.value = 10;
    assert.equal(form.canSubmit.value, false);
    await nextTick();
    assert.equal(form.availableTimes.value.length, 0);
    store.selectService(store.services.value[1]);
    await nextTick();
    assert.equal(form.maxQuantity.value, 30);
  } finally {
    scope.stop();
  }
});
