import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  freeSlots,
  closureConflicts,
  weekday,
  bookingsForClient,
  addDays,
  bookingDates,
  bookingEnd,
  type AvailabilityOptions,
  type ScheduleBooking,
} from '../src/entities/practice/index.ts';

const booking: ScheduleBooking & { id: string } = {
  id: 'one',
  clientId: 'anna',
  date: '2030-05-06',
  time: '11:00',
  service: { duration: 90 },
  status: 'confirmed',
};
const base: AvailabilityOptions = {
  date: '2030-05-06',
  duration: 60,
  bookings: [booking],
  daysOff: [],
  breaks: [],
  now: new Date('2030-05-01T00:00:00Z'),
};
test('shared occupied intervals block overlaps but allow adjacent visits', () => {
  const slots = freeSlots(base);
  assert.ok(slots.includes('10:00'));
  for (const time of ['10:30', '11:00', '11:30', '12:00']) assert.ok(!slots.includes(time));
  assert.ok(slots.includes('12:30'));
});
test('entire procedure fits into working hours', () => {
  assert.equal(freeSlots({ ...base, duration: 90 }).at(-1), '17:30');
  assert.equal(freeSlots({ ...base, duration: 30 }).at(-1), '18:30');
});
test('holidays include boundaries and recurring days off are closed', () => {
  const breaks = [{ start: '2030-05-06', end: '2030-05-08' }];
  for (const date of ['2030-05-06', '2030-05-07', '2030-05-08'])
    assert.deepEqual(freeSlots({ ...base, date, breaks }), []);
  assert.ok(freeSlots({ ...base, date: '2030-05-09', breaks }).length);
  assert.deepEqual(freeSlots({ ...base, daysOff: [weekday(base.date)] }), []);
});
test('cancellation returns time to availability', () => {
  assert.ok(
    freeSlots({ ...base, bookings: [{ ...booking, status: 'cancelled' }] }).includes('11:00'),
  );
});
test('holiday overlapping active appointment requires resolution', () => {
  assert.equal(
    closureConflicts([booking], (date) => date === booking.date, '2030-05-01').length,
    1,
  );
  assert.equal(
    closureConflicts([{ ...booking, status: 'cancelled' }], () => true, '2030-05-01').length,
    0,
  );
});
test('client cabinet only lists its owner’s records', () => {
  const records = [booking, { ...booking, id: 'two', clientId: 'maria' }];
  assert.deepEqual(
    bookingsForClient(records, 'anna').map((item) => item.id),
    ['one'],
  );
  assert.deepEqual(bookingsForClient(records, 'unknown'), []);
});
test('past times unavailable in Minsk time and dates cross months', () => {
  assert.equal(
    freeSlots({ ...base, bookings: [], now: new Date('2030-05-06T08:01:00Z') })[0],
    '11:30',
  );
  assert.equal(addDays('2030-01-31', 1), '2030-02-01');
});

test('overnight and multi-day bookings block future dates until checkout, including completed records', () => {
  const stay = { ...booking, service: { duration: 2880 } };
  assert.deepEqual(bookingEnd(stay), { date: '2030-05-08', time: '11:00' });
  assert.deepEqual(bookingDates(stay), ['2030-05-06', '2030-05-07', '2030-05-08']);
  assert.deepEqual(freeSlots({ ...base, date: '2030-05-07', bookings: [stay] }), []);
  assert.equal(freeSlots({ ...base, date: '2030-05-08', bookings: [stay] })[0], '11:00');
  assert.equal(
    freeSlots({ ...base, date: '2030-05-08', bookings: [{ ...stay, status: 'completed' }] })[0],
    '11:00',
  );
  assert.ok(
    freeSlots({
      ...base,
      date: '2030-05-07',
      bookings: [{ ...stay, status: 'cancelled' }],
    }).includes('11:00'),
  );
  assert.deepEqual(bookingDates({ ...booking, time: '12:00', service: { duration: 720 } }), [
    '2030-05-06',
  ]);
});

test('daily availability checks later occupied intervals and all closed days', () => {
  const daily: AvailabilityOptions = { ...base, duration: 2880, rentalUnit: 'day', bookings: [] };
  assert.ok(freeSlots(daily).includes('11:00'));
  assert.deepEqual(freeSlots({ ...daily, daysOff: [weekday('2030-05-07')] }), []);
  assert.deepEqual(
    freeSlots({ ...daily, breaks: [{ start: '2030-05-07', end: '2030-05-07' }] }),
    [],
  );
  assert.deepEqual(freeSlots({ ...daily, bookings: [{ ...booking, date: '2030-05-07' }] }), []);
});

test('closing a later day detects stays that began before today', () => {
  const stay = { ...booking, service: { duration: 4320 } };
  assert.deepEqual(
    closureConflicts([stay], (date) => date === '2030-05-08', '2030-05-07'),
    [stay],
  );
  assert.deepEqual(
    closureConflicts([stay], (date) => date === '2030-05-10', '2030-05-07'),
    [],
  );
});

test('availability rejects impossible dates, the past and checkout outside the booking horizon', () => {
  for (const date of ['2030-02-30', '2030-04-30', addDays('2030-05-01', 90)]) {
    assert.deepEqual(freeSlots({ ...base, date, bookings: [] }), []);
  }
  assert.deepEqual(
    freeSlots({
      ...base,
      date: addDays('2030-05-01', 89),
      duration: 1440,
      rentalUnit: 'day',
      bookings: [],
    }),
    [],
  );
  assert.ok(
    freeSlots({
      ...base,
      date: addDays('2030-05-01', 88),
      duration: 1440,
      rentalUnit: 'day',
      bookings: [],
    }).length,
  );
});
