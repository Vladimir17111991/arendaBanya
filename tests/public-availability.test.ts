import { createDateDrag } from '../src/widgets/public-availability/model/dateDrag.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectScope, nextTick } from 'vue';
import { addDays, createPracticeStore } from '../src/entities/practice/index.ts';
import { usePublicAvailability } from '../src/widgets/public-availability/model/usePublicAvailability.ts';

function setup() {
  const scope = effectScope();
  const store = createPracticeStore(() => new Date('2030-05-01T06:00:00Z'));
  const model = scope.run(() => usePublicAvailability(store))!;
  function daily() {
    model.serviceId.value = 2;
  }
  function reserve(date: string, time = '10:00', quantity = 9) {
    store.switchProfile('victoria');
    return store.book({
      service: store.services.value[0],
      date,
      time,
      quantity,
      guestCount: 2,
      reminder: false,
      customer: { mode: 'new', name: 'Гость', phone: '+375000000001' },
    });
  }
  return { scope, store, model, daily, reserve };
}

test('hourly selection keeps time slots, validates the selected time and retains guest pricing', async () => {
  const { scope, model } = setup();
  try {
    assert.equal(model.quantity.value, 2);
    assert.equal(model.guestCount.value, 4);
    assert.equal(model.totalPrice.value, 160);
    model.selectDate('2030-05-06');
    assert.ok(model.slots.value.includes('17:00'));
    model.selectedTime.value = '17:00';
    model.quantity.value = 3;
    await nextTick();
    assert.equal(model.selectedTime.value, '');
    assert.equal(model.totalPrice.value, 240);
    assert.equal(model.checkoutDate.value, '');
    model.hoverDateAt('2030-05-09');
    assert.equal(model.previewQuantity.value, 0);
    model.selectDate('2030-04-30');
    assert.equal(model.selectedDate.value, '2030-05-06');
  } finally {
    scope.stop();
  }
});

test('daily two-click range commits exclusive checkout and hover does not change price or duration', () => {
  const { scope, model, daily } = setup();
  try {
    daily();
    assert.equal(model.quantity.value, 1);
    assert.equal(model.totalPrice.value, 320);
    model.selectDate('2030-05-06');
    assert.equal(model.choosingEnd.value, true);
    model.hoverDateAt('2030-05-09');
    assert.equal(model.previewQuantity.value, 3);
    assert.equal(model.previewValid.value, true);
    assert.equal(model.rangeStart.value, '2030-05-06');
    assert.equal(model.rangeEnd.value, '2030-05-09');
    assert.equal(model.quantity.value, 1);
    assert.equal(model.totalPrice.value, 320);
    const preview = model.calendar.value.filter((day) => day.isPreview);
    assert.deepEqual(
      preview.map((day) => day.date),
      ['2030-05-06', '2030-05-07', '2030-05-08', '2030-05-09'],
    );
    assert.ok(preview.at(-1)?.isEnd);
    model.selectDate('2030-05-09');
    assert.equal(model.checkoutDate.value, '2030-05-09');
    assert.equal(model.choosingEnd.value, false);
    assert.equal(model.quantity.value, 3);
    assert.equal(model.totalPrice.value, 960);
    assert.equal(model.selectedTime.value, '');
    assert.equal(model.previewQuantity.value, 0);
    assert.equal(model.calendar.value.find((day) => day.date === '2030-05-09')?.isEnd, true);
    assert.match(model.requestDetails.value, /выезд/);
  } finally {
    scope.stop();
  }
});

test('same day keeps the pending start and reversed clicks normalize the range', () => {
  const { scope, model, daily } = setup();
  try {
    daily();
    model.selectDate('2030-05-09');
    model.selectDate('2030-05-09');
    assert.equal(model.choosingEnd.value, true);
    assert.equal(model.checkoutDate.value, '');
    model.hoverDateAt('2030-05-06');
    assert.equal(model.previewQuantity.value, 3);
    assert.equal(model.rangeStart.value, '2030-05-06');
    model.selectDate('2030-05-06');
    assert.equal(model.selectedDate.value, '2030-05-06');
    assert.equal(model.checkoutDate.value, '2030-05-09');
    assert.equal(model.quantity.value, 3);
    model.selectDate('2030-05-12');
    assert.equal(model.selectedDate.value, '2030-05-12');
    assert.equal(model.checkoutDate.value, '');
    assert.equal(model.choosingEnd.value, true);
  } finally {
    scope.stop();
  }
});

test('a range can continue into another month and its day count controls checkout', () => {
  const { scope, model, daily } = setup();
  try {
    daily();
    model.selectDate('2030-05-31');
    model.moveMonth(1);
    assert.equal(model.month.value, '2030-06');
    assert.equal(model.selectedDate.value, '2030-05-31');
    assert.equal(model.choosingEnd.value, true);
    model.selectDate('2030-06-03');
    assert.equal(model.quantity.value, 3);
    model.quantity.value = 5;
    assert.equal(model.checkoutDate.value, '2030-06-05');
    assert.equal(model.totalPrice.value, 1600);
    model.clearSelection();
    assert.equal(model.selectedDate.value, '');
    assert.equal(model.checkoutDate.value, '');
    assert.equal(model.month.value, '2030-06');
  } finally {
    scope.stop();
  }
});

test('checkout is selectable even when a new daily stay cannot begin on that date', () => {
  const { scope, model, daily, reserve } = setup();
  try {
    reserve('2030-05-14');
    daily();
    assert.deepEqual(model.slotsFor('2030-05-14', 1), []);
    model.selectDate('2030-05-13');
    const checkout = model.calendar.value.find((day) => day.date === '2030-05-14');
    assert.equal(checkout?.disabled, false);
    assert.deepEqual(checkout?.slots, ['10:00']);
    model.selectDate('2030-05-14');
    assert.equal(model.checkoutDate.value, '2030-05-14');
    assert.equal(model.quantity.value, 1);
  } finally {
    scope.stop();
  }
});

test('occupied and closed intermediate dates reject the whole range without committing preview price', () => {
  for (const blockedBy of ['booking', 'closure', 'weekday'] as const) {
    const { scope, model, store, daily, reserve } = setup();
    try {
      store.switchProfile('victoria');
      if (blockedBy === 'booking') reserve('2030-05-08');
      if (blockedBy === 'closure')
        store.addBreak({ start: '2030-05-08', end: '2030-05-08', kind: 'Выходной' });
      if (blockedBy === 'weekday') store.toggleDayOff(3);
      daily();
      model.selectDate('2030-05-06');
      model.hoverDateAt('2030-05-09');
      assert.equal(model.previewQuantity.value, 3);
      assert.equal(model.previewValid.value, false);
      assert.equal(model.calendar.value.find((day) => day.date === '2030-05-09')?.disabled, true);
      model.selectDate('2030-05-09');
      assert.equal(model.checkoutDate.value, '');
      assert.equal(model.quantity.value, 1);
      assert.equal(model.totalPrice.value, 320);
      assert.match(model.rangeError.value, /недоступен/);
    } finally {
      scope.stop();
    }
  }
});

test('ranges enforce minimum one day, maximum thirty and the full booking horizon', () => {
  const { scope, model, daily } = setup();
  try {
    daily();
    model.selectDate('2030-05-06');
    model.hoverDateAt('2030-06-06');
    assert.equal(model.previewQuantity.value, 31);
    assert.equal(model.previewValid.value, false);
    model.selectDate('2030-06-06');
    assert.equal(model.checkoutDate.value, '');
    assert.match(model.rangeError.value, /30 суток/);
    model.selectDate('2030-06-05');
    assert.equal(model.quantity.value, 30);
    model.quantity.value = 0;
    assert.equal(model.checkoutDate.value, '');
    assert.equal(model.validQuantity.value, false);
    assert.equal(model.totalPrice.value, null);
    model.clearSelection();
    model.selectDate(addDays(model.today.value, 88));
    model.selectDate(addDays(model.today.value, 90));
    assert.equal(model.checkoutDate.value, '');
    model.selectDate(addDays(model.today.value, 89));
    assert.equal(model.checkoutDate.value, model.lastDate.value);
    assert.equal(model.quantity.value, 1);
  } finally {
    scope.stop();
  }
});

test('new reservations invalidate a committed range and cancellation restores selectable dates', async () => {
  const { scope, model, store, daily, reserve } = setup();
  try {
    daily();
    model.selectDate('2030-05-06');
    model.selectDate('2030-05-09');
    const booking = reserve('2030-05-08');
    await nextTick();
    assert.equal(model.checkoutDate.value, '');
    assert.match(model.rangeError.value, /стал недоступен/);
    assert.equal(model.calendar.value.find((day) => day.date === '2030-05-09')?.disabled, true);
    store.cancelBooking(booking.id);
    await nextTick();
    assert.equal(model.calendar.value.find((day) => day.date === '2030-05-09')?.disabled, false);
    model.selectDate('2030-05-09');
    assert.equal(model.checkoutDate.value, '2030-05-09');
  } finally {
    scope.stop();
  }
});

test('switching rental formats resets dates and restores their duration defaults', () => {
  const { scope, model, daily } = setup();
  try {
    daily();
    model.selectDate('2030-05-06');
    model.hoverDateAt('2030-05-09');
    model.serviceId.value = 1;
    assert.equal(model.quantity.value, 2);
    assert.equal(model.selectedDate.value, '');
    assert.equal(model.checkoutDate.value, '');
    assert.equal(model.hoverDate.value, '');
    assert.equal(model.guestCount.value, 4);
    model.guestCount.value = 0;
    assert.equal(model.totalPrice.value, null);
  } finally {
    scope.stop();
  }
});

test('external format choice and calendar controls share selection without resetting an unchanged format', () => {
  const { scope, store, model } = setup();
  try {
    model.guestCount.value = 6;
    model.selectDate('2030-05-06');
    model.selectedTime.value = '11:00';
    store.selectService(store.services.value[1]);
    assert.equal(model.serviceId.value, 2);
    assert.equal(model.daily.value, true);
    assert.equal(model.quantity.value, 1);
    assert.equal(model.selectedDate.value, '');
    assert.equal(model.selectedTime.value, '');
    assert.equal(model.guestCount.value, 6);

    model.selectDate('2030-05-06');
    model.selectDate('2030-05-09');
    store.selectService({ ...store.services.value[1] });
    model.serviceId.value = 2;
    assert.equal(model.selectedDate.value, '2030-05-06');
    assert.equal(model.checkoutDate.value, '2030-05-09');
    assert.equal(model.quantity.value, 3);

    model.serviceId.value = 1;
    assert.equal(store.selectedService.value?.id, 1);
    assert.equal(model.daily.value, false);
    assert.equal(model.quantity.value, 2);
    assert.equal(model.selectedDate.value, '');
    assert.equal(model.checkoutDate.value, '');
    assert.equal(model.guestCount.value, 6);
  } finally {
    scope.stop();
  }
});

test('calendar respects a format chosen before mount and follows catalog fallback and rebuilding', () => {
  const scope = effectScope();
  const store = createPracticeStore(() => new Date('2030-05-01T06:00:00Z'));
  store.selectService(store.services.value[1]);
  const model = scope.run(() => usePublicAvailability(store))!;
  const currentService = () => model.service.value;
  try {
    assert.equal(model.serviceId.value, 2);
    assert.equal(model.daily.value, true);
    assert.equal(model.quantity.value, 1);
    model.selectDate('2030-05-06');
    model.selectDate('2030-05-09');
    store.switchProfile('victoria');
    store.removeService(2);
    assert.equal(model.serviceId.value, 1);
    assert.equal(model.selectedDate.value, '');
    assert.equal(model.checkoutDate.value, '');
    assert.equal(model.quantity.value, 2);
    store.removeService(1);
    assert.equal(model.serviceId.value, 0);
    assert.equal(currentService(), undefined);
    assert.equal(model.totalPrice.value, null);
    assert.ok(model.calendar.value.every((day) => day.disabled));
    model.serviceId.value = 99;
    assert.equal(model.serviceId.value, 0);
    const restored = store.addService({
      name: 'Новая баня',
      categoryId: 1,
      duration: 60,
      rentalUnit: 'hour',
      price: 20,
      description: '',
    });
    assert.equal(model.serviceId.value, restored.id);
    assert.equal(currentService()?.id, restored.id);
    assert.ok(model.slotsFor('2030-05-06').length);
  } finally {
    scope.stop();
  }
});

test('drag previews a stay, commits on release and ignores the generated click', () => {
  const { scope, model, daily } = setup();
  try {
    daily();
    const drag = createDateDrag(model, () => 1000);
    drag.begin({ id: 1, x: 0, y: 0 }, '2030-05-06');
    drag.move({ id: 1, x: 50, y: 0 }, '2030-05-09');
    assert.equal(model.previewQuantity.value, 3);
    assert.equal(model.checkoutDate.value, '');
    drag.end(1);
    assert.equal(model.checkoutDate.value, '2030-05-09');
    assert.equal(model.totalPrice.value, 960);
    assert.equal(drag.ignoreClick(1), true);
    assert.equal(drag.ignoreClick(0), false);
    drag.cancel();
    assert.equal(model.checkoutDate.value, '2030-05-09');
  } finally {
    scope.stop();
  }
});

test('taps, reverse drag, cancellation and other pointers preserve range rules', () => {
  const { scope, model, daily } = setup();
  try {
    daily();
    const drag = createDateDrag(model);
    drag.begin({ id: 1, x: 0, y: 0 }, '2030-05-06');
    drag.move({ id: 2, x: 80, y: 0 }, '2030-05-09');
    drag.end(2);
    assert.equal(drag.active, true);
    drag.end(1);
    assert.equal(model.selectedDate.value, '2030-05-06');
    drag.begin({ id: 1, x: 0, y: 0 }, '2030-05-09');
    drag.end(1);
    assert.equal(model.checkoutDate.value, '2030-05-09');
    drag.begin({ id: 1, x: 80, y: 0 }, '2030-05-10');
    drag.move({ id: 1, x: 0, y: 0 }, '2030-05-07');
    drag.end(1);
    assert.equal(model.selectedDate.value, '2030-05-07');
    assert.equal(model.checkoutDate.value, '2030-05-10');
    drag.begin({ id: 1, x: 0, y: 0 }, '2030-05-12');
    drag.move({ id: 1, x: 90, y: 0 }, '2030-05-15');
    drag.cancel();
    assert.equal(model.selectedDate.value, '');
    assert.equal(model.checkoutDate.value, '');
  } finally {
    scope.stop();
  }
});

test('drag cannot reserve across an occupied date or release outside the dates', () => {
  const { scope, model, daily, reserve } = setup();
  try {
    reserve('2030-05-08');
    daily();
    const drag = createDateDrag(model);
    drag.begin({ id: 1, x: 0, y: 0 }, '2030-05-06');
    drag.move({ id: 1, x: 90, y: 0 }, '2030-05-10');
    drag.end(1);
    assert.equal(model.checkoutDate.value, '');
    assert.ok(model.rangeError.value);
    drag.begin({ id: 1, x: 0, y: 0 }, '2030-05-12');
    drag.move({ id: 1, x: 90, y: 0 }, '');
    drag.end(1);
    assert.equal(model.checkoutDate.value, '');
  } finally {
    scope.stop();
  }
});

test('drag keeps the preview and last date while crossing gaps between cells', () => {
  const { scope, model, daily } = setup();
  try {
    daily();
    const drag = createDateDrag(model);
    drag.begin({ id: 1, x: 0, y: 0 }, '2030-05-06');
    drag.move({ id: 1, x: 50, y: 0 }, '2030-05-09');
    drag.move({ id: 1, x: 55, y: 0 }, undefined);
    assert.equal(model.previewQuantity.value, 3);
    assert.equal(model.rangeEnd.value, '2030-05-09');
    drag.end(1);
    assert.equal(model.checkoutDate.value, '2030-05-09');
  } finally {
    scope.stop();
  }
});

test('new rental names use their billing unit rather than bedroom or bathhouse wording', () => {
  const { scope, store, model } = setup();
  try {
    store.switchProfile('victoria');
    for (const unit of ['hour', 'day'] as const) {
      const service = store.addService({
        name: 'Отдых с террасой ' + unit,
        categoryId: 1,
        duration: unit === 'day' ? 1440 : 60,
        rentalUnit: unit,
        price: 35,
        description: '',
      });
      store.selectService(service);
      assert.equal(model.daily.value, unit === 'day');
      model.selectDate('2030-05-06');
      if (unit === 'day') model.selectDate('2030-05-08');
      else assert.ok(model.slots.value.length);
      assert.equal(model.totalPrice.value, 35 * model.quantity.value * model.guestCount.value);
      assert.ok(model.requestDetails.value.includes('Отдых с террасой'));
    }
  } finally {
    scope.stop();
  }
});
