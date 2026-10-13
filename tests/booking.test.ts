import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findClientByPhone,
  matchesClient,
  prepareBooking,
  type PrepareBookingOptions,
  type Client,
  freeSlots,
  bookingEnd,
  services,
  rentalPrice,
} from '../src/entities/practice/index.ts';

const clients: Client[] = [
  {
    id: 'client-1',
    accountId: null,
    name: 'Анна',
    phone: '+375 (00) 000-00-01',
    reminderChannel: null,
  },
  {
    id: 'client-2',
    accountId: null,
    name: 'Мария',
    phone: '+375 (00) 000-00-02',
    reminderChannel: null,
  },
];
const base: PrepareBookingOptions = {
  actor: { id: 'victoria', role: 'admin' },
  clients,
  bookings: [],
  service: services[0],
  quantity: 2,
  date: '2030-05-06',
  time: '11:00',
  daysOff: [],
  breaks: [],
  customer: { mode: 'existing', clientId: 'client-1' },
  reminder: false,
  now: new Date('2030-05-01T00:00:00Z'),
};

test('manual hourly booking keeps a duration snapshot and blocks overlapping bookings', () => {
  const { booking, newClient } = prepareBooking(base);
  assert.equal(newClient, null);
  assert.equal(booking.clientId, 'client-1');
  assert.equal(booking.createdBy, 'victoria');
  assert.equal(booking.source, 'admin');
  assert.equal(booking.quantity, 2);
  assert.equal(booking.guestCount, 1);
  assert.equal(booking.unitPrice, 20);
  assert.equal(booking.service.price, 40);
  assert.equal(booking.service.duration, 120);
  assert.equal(services[0].duration, 60);
  assert.deepEqual(bookingEnd(booking), { date: base.date, time: '13:00' });
  assert.ok(!freeSlots({ ...base, duration: 60, bookings: [booking] }).includes('12:30'));
  assert.throws(
    () => prepareBooking({ ...base, bookings: [booking], time: '12:30' }),
    /время уже недоступно/,
  );
  assert.doesNotThrow(() => prepareBooking({ ...base, bookings: [booking], time: '13:00' }));
});

test('several days with a bedroom reserve every night and reject a stale confirmation', () => {
  const daily = { ...base, service: services[1], quantity: 3 };
  const { booking } = prepareBooking(daily);
  assert.equal(booking.service.duration, 4320);
  assert.deepEqual(bookingEnd(booking), { date: '2030-05-09', time: '11:00' });
  assert.throws(
    () => prepareBooking({ ...base, date: '2030-05-08', bookings: [booking] }),
    /время уже недоступно/,
  );
  assert.throws(() => prepareBooking({ ...daily, bookings: [booking] }), /время уже недоступно/);
  assert.doesNotThrow(() => prepareBooking({ ...base, date: '2030-05-09', bookings: [booking] }));
  for (const quantity of [0, -1, 1.5, 31, NaN]) {
    assert.throws(() => prepareBooking({ ...daily, quantity }), /целое число/);
  }
});

test('a booking charges each guest for every hour or day and preserves the unit tariff', () => {
  const { booking: hourly } = prepareBooking({ ...base, guestCount: 4, quantity: 3 });
  assert.equal(hourly.guestCount, 4);
  assert.equal(hourly.unitPrice, 20);
  assert.equal(hourly.service.price, 240);
  assert.equal(hourly.service.duration, 180);
  const { booking: daily } = prepareBooking({
    ...base,
    service: services[1],
    guestCount: 4,
    quantity: 2,
  });
  assert.equal(daily.unitPrice, 80);
  assert.equal(daily.service.price, 640);
  assert.equal(daily.service.duration, 2880);
  assert.equal(services[0].price, 20);
  assert.equal(services[1].price, 80);
});

test('guest count validation is atomic and does not change occupied rental duration', () => {
  const snapshot = JSON.stringify(base);
  for (const guestCount of [0, -1, 1.5, 31, NaN, Infinity]) {
    assert.throws(
      () =>
        prepareBooking({
          ...base,
          guestCount,
          customer: { mode: 'new', name: 'Елена', phone: '+375000000003' },
        }),
      /целое число гостей/,
    );
  }
  assert.equal(JSON.stringify(base), snapshot);
  const oneGuest = prepareBooking({ ...base, guestCount: 1 }).booking;
  const thirtyGuests = prepareBooking({ ...base, guestCount: 30 }).booking;
  assert.equal(oneGuest.service.duration, thirtyGuests.service.duration);
  assert.equal(thirtyGuests.service.price, 1200);
  assert.throws(
    () => prepareBooking({ ...base, guestCount: 1, bookings: [thirtyGuests] }),
    /недоступно/,
  );
});

test('shared rental price calculation uses currency cents and tolerates incomplete previews', () => {
  assert.equal(rentalPrice({ price: 20 }, 2, 4), 160);
  assert.equal(rentalPrice({ price: 80 }, 3, 2), 480);
  assert.equal(rentalPrice({ price: 19.99 }, 3, 7), 419.79);
  assert.equal(rentalPrice({ price: 0.29 }, 3, 3), 2.61);
  assert.equal(rentalPrice({ price: 20 }), 20);
  assert.equal(rentalPrice({ price: 0 }, 2, 4), 0);
  assert.equal(rentalPrice({ price: 20 }, 0, 4), 0);
  assert.equal(rentalPrice({ price: 20 }, 2, NaN), 0);
});

test('new client receives a reusable card only after successful validation', () => {
  const { booking, newClient } = prepareBooking({
    ...base,
    customer: { mode: 'new', name: '  Елена  ', phone: '+375 (00) 000-00-03' },
  });
  assert.ok(newClient);
  assert.equal(newClient.name, 'Елена');
  assert.equal(newClient.phone, '+375000000003');
  assert.equal(newClient.accountId, null);
  assert.equal(booking.clientId, newClient.id);
  assert.equal(booking.reminder, false);
  const followUp = prepareBooking({
    ...base,
    clients: [...clients, newClient],
    bookings: [booking],
    time: '13:00',
    customer: { mode: 'existing', clientId: newClient.id },
  });
  assert.equal(followUp.newClient, null);
  assert.equal(followUp.booking.clientId, newClient.id);
});

test('phone normalization prevents duplicate cards and supports search', () => {
  assert.equal(findClientByPhone(clients, '375000000001')?.id, 'client-1');
  assert.throws(
    () =>
      prepareBooking({
        ...base,
        customer: { mode: 'new', name: 'Другое имя', phone: '+375-00-000-00-01' },
      }),
    /уже есть/,
  );
  assert.ok(matchesClient(clients[0], ' АННА '));
  assert.ok(matchesClient(clients[1], '000-00-02'));
  assert.equal(matchesClient(clients[0], 'Елена'), false);
});

test('visitors and client profiles cannot create a booking online', () => {
  for (const role of ['guest', 'client'] as const) {
    assert.throws(() => prepareBooking({ ...base, actor: { id: 'visitor', role } }), /Виктория/);
  }
  assert.throws(() => prepareBooking({ ...base, actor: null }), /Виктория/);
});

test('closed days and invalid requests do not mutate clients or bookings', () => {
  const snapshot = JSON.stringify(base);
  assert.throws(
    () =>
      prepareBooking({
        ...base,
        daysOff: [1],
        customer: { mode: 'new', name: 'Елена', phone: '+375000000003' },
      }),
    /время уже недоступно/,
  );
  assert.equal(JSON.stringify(base), snapshot);
  assert.throws(
    () =>
      prepareBooking({
        ...base,
        service: services[1],
        breaks: [{ start: '2030-05-07', end: '2030-05-07' }],
      }),
    /время уже недоступно/,
  );
  assert.throws(() => prepareBooking({ ...base, time: '18:00' }), /время уже недоступно/);
  assert.throws(
    () => prepareBooking({ ...base, customer: { mode: 'existing', clientId: 'missing' } }),
    /Выберите клиента/,
  );
  for (const name of ['', '  ', 'А'.repeat(61)]) {
    assert.throws(
      () => prepareBooking({ ...base, customer: { mode: 'new', name, phone: '+375000000003' } }),
      /имя клиента/,
    );
  }
  for (const phone of ['123', '+70000000003', '+375000000003text']) {
    assert.throws(
      () => prepareBooking({ ...base, customer: { mode: 'new', name: 'Елена', phone } }),
      /телефон/,
    );
  }
});

test('past times, nonexistent dates and the entire booking beyond the horizon are rejected', () => {
  assert.throws(
    () => prepareBooking({ ...base, now: new Date('2030-05-06T09:00:00Z') }),
    /время уже недоступно/,
  );
  for (const date of ['2030-04-30', '2030-02-30', '2030-08-01']) {
    assert.throws(() => prepareBooking({ ...base, date }), /90 дней/);
  }
  assert.throws(
    () => prepareBooking({ ...base, service: services[1], date: '2030-07-28' }),
    /время уже недоступно/,
  );
});
