import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectScope, nextTick } from 'vue';
import { createPracticeStore, freeSlots } from '../src/entities/practice/index.ts';
import { useBookingForm } from '../src/features/book-appointment/model.ts';

function setup() {
  const store = createPracticeStore(() => new Date('2030-05-01T06:00:00Z'));
  store.switchProfile('victoria');
  const client = store.addClient('Анна', '+375000000001');
  const date = '2030-05-06';
  const draft = {
    service: store.services.value[0],
    date,
    time: '11:00',
    quantity: 2,
    reminder: false,
    customer: { mode: 'existing' as const, clientId: client.id },
  };
  return { store, client, date, draft };
}

test('new site has empty client records, rental formats and Victoria as its owner', () => {
  const store = createPracticeStore();
  assert.equal(store.clients.value.length, 0);
  assert.equal(store.bookings.value.length, 0);
  assert.deepEqual(store.daysOff.value, []);
  assert.deepEqual(
    store.profiles.value.map((item) => item.id),
    ['guest', 'victoria'],
  );
  assert.deepEqual(
    store.services.value.map((item) => item.rentalUnit),
    ['hour', 'day'],
  );
  assert.deepEqual(
    store.services.value.map((item) => item.price),
    [20, 80],
  );
});

test('only owner can create and cancel bookings and cancellation restores availability', () => {
  const { store, draft } = setup();
  const booking = store.book(draft);
  store.switchProfile('guest');
  assert.equal(store.visibleBookings.value.length, 0);
  assert.throws(() => store.book({ ...draft, time: '14:00' }), /Виктория/);
  store.cancelBooking(booking.id);
  assert.equal(store.bookings.value[0].status, 'confirmed');
  store.switchProfile('victoria');
  store.cancelBooking(booking.id);
  assert.equal(store.activeCount.value, 0);
  assert.ok(
    freeSlots({
      ...draft,
      duration: 120,
      bookings: store.bookings.value,
      daysOff: store.daysOff.value,
      breaks: store.breaks.value,
      now: store.clock.value,
    }).includes('11:00'),
  );
});

test('closures and date filters account for every day of an overnight booking', () => {
  const { store, draft } = setup();
  const booking = store.book({ ...draft, service: store.services.value[1], quantity: 2 });
  store.adminDate.value = '2030-05-07';
  assert.equal(store.visibleBookings.value[0].id, booking.id);
  store.addBreak({ start: '2030-05-07', end: '2030-05-07', kind: 'Отпуск' });
  assert.equal(store.breaks.value.length, 0);
  assert.equal(store.conflicts.value[0].id, booking.id);
  store.toggleDayOff(2);
  assert.equal(store.daysOff.value.length, 0);
  store.cancelBooking(booking.id);
  store.addBreak({ start: '2030-05-07', end: '2030-05-07', kind: 'Отпуск' });
  assert.equal(store.breaks.value.length, 1);
  assert.equal(store.closureError.value, '');
  store.removeBreak(store.breaks.value[0].id);
  assert.equal(store.breaks.value.length, 0);
});

test('invalid closure dates cannot change the schedule', () => {
  const { store } = setup();
  store.addBreak({ start: '2030-05-31', end: '2030-06-31', kind: 'Отпуск' });
  assert.equal(store.breaks.value.length, 0);
  assert.match(store.closureError.value, /корректный период/);
  store.toggleDayOff(8);
  assert.deepEqual(store.daysOff.value, []);
});

test('store re-reads the catalog and rejects a stale service or overlapping confirmation', () => {
  const { store, draft } = setup();
  store.updateService(1, 0, 120);
  const booking = store.book({ ...draft, quantity: 1 });
  assert.equal(booking.service.duration, 120);
  assert.throws(() => store.book({ ...draft, time: '12:00' }), /недоступно/);
  store.removeService(1);
  assert.throws(() => store.book({ ...draft, time: '14:00' }), /больше не доступен/);
});

test('form resets a selected time when a new reservation blocks the interval', async () => {
  const { store, draft, date } = setup();
  const scope = effectScope();
  try {
    const form = scope.run(() => useBookingForm(store));
    assert.ok(form);
    form.selectDate(date);
    form.time.value = '11:00';
    store.book(draft);
    await nextTick();
    assert.equal(form.time.value, '');
    assert.ok(!form.availableTimes.value.includes('11:00'));
  } finally {
    scope.stop();
  }
});

test('new-client form saves one valid card and clears the draft between bookings', async () => {
  const { store, date } = setup();
  const scope = effectScope();
  try {
    const form = scope.run(() => useBookingForm(store));
    assert.ok(form);
    form.customer.value = { mode: 'new', name: 'Елена', phone: '+375000000003' };
    form.selectDate(date);
    form.time.value = '10:00';
    form.submit();
    await nextTick();
    assert.ok(form.success.value);
    assert.equal(store.clients.value.length, 2);
    assert.equal(form.success.value.reminder, false);
    form.reset();
    await nextTick();
    assert.equal(form.success.value, null);
    assert.equal(form.time.value, '');
    assert.deepEqual(form.customer.value, { mode: 'existing', clientId: '' });
    assert.equal(form.canSubmit.value, false);
    assert.equal(createPracticeStore().clients.value.length, 0);
  } finally {
    scope.stop();
  }
});
