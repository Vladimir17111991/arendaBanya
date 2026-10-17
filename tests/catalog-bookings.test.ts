import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeStore, freeSlots } from '../src/entities/practice/index.ts';

function setup() {
  let instant = new Date('2030-01-08T06:00:00Z');
  const store = createPracticeStore(() => instant);
  store.switchProfile('victoria');
  const client = store.addClient('Анна', '+375000000001');
  const draft = {
    service: { ...store.services.value[0] },
    date: '2030-01-08',
    time: '10:00',
    quantity: 2,
    reminder: false,
    customer: { mode: 'existing' as const, clientId: client.id },
  };
  return {
    store,
    client,
    draft,
    at(value: string) {
      instant = new Date(value);
      store.refreshClock();
    },
  };
}

test('catalog changes preserve photo links and historical rental snapshots', () => {
  const { store, draft } = setup();
  const booking = store.book(draft);
  store.addPhoto({ categoryIds: [1], title: 'Парная', url: 'blob:fixture' });
  const category = store.addCategory(' Дополнительно ');
  assert.throws(() => store.addCategory('дополнительно'), /уже есть/);
  store.renameCategory(1, 'Почасовой отдых');
  assert.equal(store.services.value[0].category, 'Почасовой отдых');
  assert.throws(() => store.removeCategory(1, 1), /другую категорию/);
  store.removeCategory(1, category.id);
  assert.equal(store.services.value[0].categoryId, category.id);
  assert.deepEqual(store.photos.value[0].categoryIds, [category.id]);
  const service = store.addService({
    name: 'Вечер в бане',
    categoryId: category.id,
    description: 'Описание',
    duration: 60,
    rentalUnit: 'hour',
    price: 0,
  });
  store.editService(service.id, { ...service, name: 'Отдых в бане', price: 80, duration: 120 });
  store.removeService(1);
  assert.deepEqual(store.photos.value[0].categoryIds, [category.id]);
  assert.equal(booking.service.name, 'Баня по часам');
  assert.equal(booking.service.category, 'Почасовая аренда');
  assert.equal(booking.service.duration, 120);
  assert.equal(booking.service.price, 40);
  assert.throws(() => store.book({ ...draft, time: '14:00' }), /больше не доступен/);
  assert.ok(
    !freeSlots({
      date: draft.date,
      duration: 60,
      bookings: store.bookings.value,
      daysOff: [],
      breaks: [],
      now: store.clock.value,
    }).includes('10:30'),
  );
});

test('empty catalog can be rebuilt without reusing IDs', () => {
  const { store } = setup();
  const selection = () => store.selectedService.value;
  for (const service of store.services.value) store.removeService(service.id);
  for (const category of store.categories.value) store.removeCategory(category.id);
  assert.equal(selection(), null);
  const category = store.addCategory('Новая категория');
  const service = store.addService({
    categoryId: category.id,
    name: 'Новая аренда',
    description: '',
    price: 0,
    duration: 60,
    rentalUnit: 'hour',
  });
  assert.ok(category.id > 2 && service.id > 2);
  assert.equal(selection()?.id, service.id);
});

test('service details and rental units validate atomically and preserve old reservations', () => {
  const { store, draft } = setup();
  const booking = store.book(draft);
  const originalDetails = { ...booking.service.details };
  const details = { forWhom: ' Гостям ', includes: ' Баня ', preparation: ' Обсудим по телефону ' };
  store.editService(1, { ...draft.service, details });
  assert.deepEqual(store.services.value[0].details, {
    forWhom: 'Гостям',
    includes: 'Баня',
    preparation: 'Обсудим по телефону',
  });
  assert.deepEqual(booking.service.details, originalDetails);
  details.includes = 'Внешняя правка';
  assert.equal(store.services.value[0].details?.includes, 'Баня');
  const snapshot = JSON.stringify(store.services.value);
  assert.throws(
    () =>
      store.editService(1, {
        ...draft.service,
        details: { ...details, includes: 'x'.repeat(501) },
      }),
    /до 500/,
  );
  assert.throws(
    () => store.editService(1, { ...draft.service, rentalUnit: 'day', duration: 60 }),
    /полных суток/,
  );
  assert.equal(JSON.stringify(store.services.value), snapshot);
  store.editService(1, { ...draft.service, rentalUnit: 'day', duration: 1440, price: 50 });
  assert.equal(store.services.value[0].rentalUnit, 'day');
  assert.equal(booking.service.rentalUnit, 'hour');
  const stay = store.book({ ...draft, date: '2030-01-09', quantity: 3 });
  assert.equal(stay.service.duration, 4320);
  assert.equal(stay.service.price, 150);
});

test('tariff changes affect new bookings but preserve existing guest counts and price snapshots', () => {
  const { store, draft } = setup();
  const original = store.book({ ...draft, guestCount: 4 });
  assert.equal(original.unitPrice, 20);
  assert.equal(original.service.price, 160);
  store.updateService(1, 35, 60);
  const next = store.book({ ...draft, time: '14:00', guestCount: 3 });
  assert.equal(next.unitPrice, 35);
  assert.equal(next.guestCount, 3);
  assert.equal(next.service.price, 210);
  assert.equal(original.unitPrice, 20);
  assert.equal(original.guestCount, 4);
  assert.equal(original.quantity, 2);
  assert.equal(original.service.price, 160);
});

test('bathhouse photos survive moves and release owned URLs on removal', (context) => {
  const revoked: string[] = [];
  context.mock.method(URL, 'revokeObjectURL', (url: string) => revoked.push(url));
  const { store } = setup();
  store.addPhoto({ categoryIds: [1], title: ' Парная ', url: 'blob:photo' });
  const id = store.photos.value[0].id;
  assert.equal(store.photos.value[0].title, 'Парная');
  store.removeCategory(1, 2);
  store.removeService(1);
  assert.deepEqual(store.photos.value[0].categoryIds, [2]);
  assert.deepEqual(revoked, []);
  store.removePhoto(id);
  assert.deepEqual(revoked, ['blob:photo']);
  store.dispose();
  assert.equal(revoked.length, 1);
});

test('photo validation is atomic and disposal releases uploads', (context) => {
  const revoked: string[] = [];
  context.mock.method(URL, 'revokeObjectURL', (url: string) => revoked.push(url));
  const { store } = setup();
  assert.throws(
    () =>
      store.addPhoto({ categoryIds: [1], title: 'Парная', url: 'https://example.com/photo.jpg' }),
    /с устройства/,
  );
  assert.throws(() => store.addPhoto({ categoryIds: [], url: 'blob:photo' }), /категори/);
  assert.equal(store.photos.value.length, 0);
  store.addPhoto({ categoryIds: [1], title: 'Парная', url: 'blob:photo' });
  store.dispose();
  assert.deepEqual(revoked, ['blob:photo']);
});

test('rental completion is available after checkout and supports correction', () => {
  const { store, draft, at } = setup();
  const first = store.book(draft);
  const cancelled = store.book({ ...draft, time: '12:00' });
  assert.equal(first.status, 'confirmed');
  assert.throws(() => store.completeBooking(first.id), /после окончания/);
  at('2030-01-08T07:05:00Z');
  assert.throws(() => store.completeBooking(first.id), /после окончания/);
  store.cancelBooking(cancelled.id);
  at('2030-01-08T09:00:00Z');
  store.completeBooking(first.id);
  assert.equal(first.status, 'completed');
  assert.equal(store.feedback.value, 'Аренда завершена.');
  assert.equal(store.activeCount.value, 0);
  assert.throws(() => store.completeBooking(first.id));
  assert.throws(() => store.completeBooking(cancelled.id));
  store.cancelBooking(first.id);
  assert.equal(first.status, 'completed');
  const next = store.book({ ...draft, time: '14:00' });
  store.undoCompletion(first.id);
  assert.equal(first.status, 'confirmed');
  assert.equal(next.status, 'confirmed');
  assert.equal(store.activeCount.value, 2);
});

test('guest cannot edit catalog or change rental completion', () => {
  const { store, draft } = setup();
  const booking = store.book(draft);
  store.switchProfile('guest');
  const actions = [
    () => store.addCategory('Чужая'),
    () => store.renameCategory(1, 'Чужая'),
    () => store.removeCategory(1, 2),
    () => store.removeService(1),
    () => store.addService({ ...draft.service, categoryId: 1 }),
    () => store.editService(1, { ...draft.service, categoryId: 1 }),
    () => store.completeBooking(booking.id),
    () => store.undoCompletion(booking.id),
  ];
  for (const action of actions) assert.throws(action, /только Виктории/);
  assert.equal(booking.status, 'confirmed');
  assert.equal(store.categories.value.length, 2);
});
