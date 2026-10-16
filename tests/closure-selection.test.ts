import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeStore } from '../src/entities/practice/index.ts';
import { useClosureSelection } from '../src/features/manage-schedule/model/useClosureSelection.ts';

function setup() {
  const store = createPracticeStore(() => new Date('2030-05-01T06:00:00Z'));
  store.switchProfile('victoria');
  const model = useClosureSelection(store);
  return { store, model };
}

test('one click selects a single day off and saving resets the calendar selection', () => {
  const { store, model } = setup();
  assert.equal(model.canSubmit.value, false);
  model.selectDate('2030-05-06');
  assert.deepEqual(model.selection.value, {
    start: '2030-05-06',
    end: '2030-05-06',
    kind: 'Выходной',
  });
  model.submit();
  assert.equal(store.breaks.value.length, 1);
  assert.equal(store.breaks.value[0].end, '2030-05-06');
  assert.equal(model.start.value, '');
  assert.equal(model.saved.value?.kind, 'Выходной');
  assert.equal(model.days.value.find((day) => day.date === '2030-05-06')?.closed, true);
});

test('vacation needs two dates, includes the last day and survives month navigation', () => {
  const { store, model } = setup();
  model.changeKind('Отпуск');
  model.selectDate('2030-05-30');
  model.previewDate('2030-06-02');
  assert.equal(model.days.value.filter((day) => day.preview).length, 4);
  assert.equal(model.canSubmit.value, false);
  model.submit();
  assert.equal(store.breaks.value.length, 0);
  model.moveMonth(1);
  assert.equal(model.start.value, '2030-05-30');
  model.selectDate('2030-06-02');
  model.submit();
  assert.equal(store.breaks.value[0].start, '2030-05-30');
  assert.equal(store.breaks.value[0].end, '2030-06-02');
});

test('reversed vacation dates normalize and switching to day off never retains a period', () => {
  const { model } = setup();
  model.changeKind('Отпуск');
  model.selectDate('2030-05-12');
  model.selectDate('2030-05-08');
  assert.equal(model.start.value, '2030-05-08');
  assert.equal(model.end.value, '2030-05-12');
  model.changeKind('Выходной');
  assert.equal(model.end.value, model.start.value);
  model.selectDate('2030-05-20');
  assert.equal(model.end.value, '2030-05-20');
  model.changeKind('Отпуск');
  assert.equal(model.end.value, '');
  assert.equal(model.canSubmit.value, false);
});

test('calendar marks overnight bookings and blocks an inclusive range until cancellation', () => {
  const { store, model } = setup();
  const booking = store.book({
    service: store.services.value[1],
    date: '2030-05-07',
    time: '10:00',
    quantity: 2,
    reminder: false,
    customer: { mode: 'new', name: 'Анна', phone: '+375000000001' },
  });
  assert.equal(model.days.value.find((day) => day.date === '2030-05-08')?.booked, 1);
  model.changeKind('Отпуск');
  model.selectDate('2030-05-06');
  model.selectDate('2030-05-10');
  assert.equal(model.periodBookings.value[0].id, booking.id);
  assert.equal(model.canSubmit.value, false);
  model.submit();
  assert.equal(store.breaks.value.length, 0);
  store.cancelBooking(booking.id);
  assert.equal(model.canSubmit.value, true);
  model.submit();
  assert.equal(store.breaks.value.length, 1);
});

test('past dates, duplicate closures, regular days off and guest access cannot close dates', () => {
  const { store, model } = setup();
  model.selectDate('2030-04-30');
  model.selectDate('2030-02-31');
  assert.equal(model.start.value, '');
  model.moveMonth(-1);
  assert.equal(model.month.value, '2030-05-01');
  store.addBreak({ start: '2030-05-06', end: '2030-05-08', kind: 'Отпуск' });
  model.selectDate('2030-05-07');
  assert.ok(model.overlappingPeriod.value);
  assert.equal(model.canSubmit.value, false);
  store.toggleDayOff(0);
  model.selectDate('2030-05-12');
  assert.equal(model.regularDayOff.value, true);
  assert.equal(model.canSubmit.value, false);
  model.selectDate('2030-05-13');
  store.switchProfile('guest');
  model.submit();
  assert.equal(store.breaks.value.length, 1);
});
