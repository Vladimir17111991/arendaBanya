import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeStore, addDays } from '../src/entities/practice/index.ts';
import { contactMessage } from '../src/features/contact-specialist/lib/contactMessage.ts';
import { phone } from '../src/entities/specialist/index.ts';

const now = () => new Date('2030-01-08T06:00:00Z');
function draft(store: ReturnType<typeof createPracticeStore>) {
  return {
    service: store.services.value[0]!,
    date: addDays(store.today.value, 1),
    time: '11:00',
    quantity: 2,
    reminder: false,
  };
}

test('visitors cannot book, create clients or change public content', () => {
  const store = createPracticeStore(now);
  assert.equal(store.isGuest.value, true);
  assert.throws(() => store.book(draft(store)));
  assert.throws(() => store.addClient('Елена', '+375000000003'), /только Виктории/);
  assert.throws(() => store.updateService(1, 120, 60), /только Виктории/);
  assert.throws(
    () => store.addPhoto({ serviceId: 1, title: 'Баня', url: 'blob:test' }),
    /только Виктории/,
  );
  assert.throws(() => store.removePhoto('missing'), /только Виктории/);
  assert.equal(store.clients.value.length, 0);
  assert.equal(store.photos.value.length, 0);
});

test('Victoria adds clients and records their bookings without visitor accounts', () => {
  const store = createPracticeStore(now);
  store.switchProfile('victoria');
  const client = store.addClient(' Елена ', '+375 (00) 000-00-03');
  assert.equal(store.bookings.value.length, 0);
  assert.throws(() => store.addClient('Повтор', '+375000000003'), /уже есть/);
  assert.equal(store.clients.value.length, 1);
  assert.equal(client.accountId, null);
  assert.equal(store.profiles.value.filter((item) => item.id === client.id).length, 0);
  const booking = store.book({
    ...draft(store),
    customer: { mode: 'existing', clientId: client.id },
  });
  assert.equal(booking.clientId, client.id);
  assert.equal(booking.service.duration, 120);
  store.switchProfile('guest');
  assert.equal(store.visibleBookings.value.length, 0);
  assert.throws(() => store.book(draft(store)));
});

test('rental price changes preserve existing booking snapshots', () => {
  const store = createPracticeStore(now);
  store.switchProfile('victoria');
  const client = store.addClient('Елена', '+375000000003');
  const original = {
    ...draft(store),
    customer: { mode: 'existing' as const, clientId: client.id },
  };
  const booking = store.book(original);
  store.updateService(1, 50, 60);
  assert.equal(booking.service.price, 40);
  const next = store.book({ ...original, time: '14:00' });
  assert.equal(next.service.price, 100);
  assert.equal(next.service.duration, 120);
});

test('bathhouse gallery accepts a single photo and allows removal', () => {
  const store = createPracticeStore(now);
  store.switchProfile('victoria');
  assert.throws(() => store.addPhoto({ serviceId: 99, title: 'Фото', url: 'blob:demo' }));
  assert.throws(() => store.addPhoto({ serviceId: 1, title: ' ', url: 'blob:demo' }));
  store.addPhoto({ serviceId: 1, title: ' Парная ', url: 'blob:demo' });
  const photo = store.photos.value[0]!;
  assert.equal(photo.title, 'Парная');
  assert.equal(photo.beforeUrl, undefined);
  store.removePhoto(photo.id);
  assert.equal(store.photos.value.length, 0);
});

test('sample contact cannot call a real person and keeps selected rental details', () => {
  assert.equal(phone.href, null);
  assert.equal(phone.isDemo, true);
  assert.match(contactMessage('2 суток, 10 января, 12:00'), /Виктория.*2 суток, 10 января, 12:00/);
});
