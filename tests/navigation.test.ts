import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRef } from 'vue';
import { createNavigation } from '../src/app/model/navigation.ts';
import { createPracticeStore } from '../src/entities/practice/index.ts';
import { sections } from '../src/shared/routing/index.ts';

test('guest route guard prevents entering private screens or resetting their state', () => {
  const store = createPracticeStore();
  const navigation = createNavigation(() => store.isGuest.value);
  for (const view of ['booking', 'cabinet', 'access'] as const) {
    navigation.navigate(view, { reset: true, tab: 'schedule' });
    assert.equal(navigation.view.value, 'contacts');
  }
  assert.equal(navigation.cabinetTab.value, 'overview');
  assert.equal(navigation.bookingSession.value, 0);
  navigation.navigate('price');
  assert.equal(navigation.view.value, 'price');
  assert.ok(sections.includes('availability'));
});

test('manual booking opens a fresh form and returns to the calendar', () => {
  const store = createPracticeStore(() => new Date('2030-01-08T06:00:00Z'));
  const navigation = createNavigation(() => store.isGuest.value);
  store.switchProfile('victoria');
  const client = store.addClient('Елена', '+375000000003');
  navigation.navigate('cabinet');
  navigation.navigate('booking', { reset: true });
  const booking = store.book({
    service: store.services.value[0]!,
    date: '2030-01-08',
    time: '10:00',
    quantity: 2,
    reminder: false,
    customer: { mode: 'existing', clientId: client.id },
  });
  store.focusBooking(booking);
  navigation.navigate('cabinet', { tab: 'overview' });
  assert.equal(navigation.view.value, 'cabinet');
  assert.equal(navigation.cabinetTab.value, 'overview');
  assert.equal(store.adminDate.value, booking.date);
  assert.equal(store.visibleBookings.value[0]?.id, booking.id);
  navigation.navigate('booking', { reset: true });
  assert.equal(navigation.bookingSession.value, 2);
  store.switchProfile('guest');
  navigation.navigate('services');
  assert.equal(navigation.view.value, 'services');
});

test('public model refs stay reactive and app instances remain isolated', () => {
  const first = createPracticeStore();
  const second = createPracticeStore();
  const { services, isAdmin, currentUser, selectedService } = first;
  for (const value of [services, isAdmin, currentUser, selectedService]) assert.ok(isRef(value));
  first.switchProfile('victoria');
  first.selectService(first.services.value[0]!);
  assert.equal(isAdmin.value, true);
  assert.equal(currentUser.value.id, 'victoria');
  first.updateService(1, 130, 60);
  assert.equal(selectedService.value?.price, 130);
  assert.equal(services.value[0]?.price, 130);
  assert.equal(second.services.value[0]?.price, 20);
  assert.equal(second.isAdmin.value, false);
});
