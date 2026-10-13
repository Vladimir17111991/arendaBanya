import { computed, ref, watch } from 'vue';
import {
  addDays,
  adjacentMonth,
  BOOKING_HORIZON_DAYS,
  freeSlots,
  HOURS,
  isDateKey,
  MAX_GUESTS,
  monthDates,
  rentalPrice,
  type PracticeStore,
} from '../../../entities/practice/index.ts';
import { fullDate, money } from '../../../shared/lib/format/index.ts';

const DAY_MINUTES = 1440;
const DAY_MS = DAY_MINUTES * 60_000;

function dateDifference(start: string, end: string): number {
  return (Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / DAY_MS;
}

function normalizedRange(first: string, second: string) {
  const start = first < second ? first : second;
  const end = first < second ? second : first;
  return { start, end, quantity: dateDifference(start, end) };
}

export function usePublicAvailability(store: PracticeStore) {
  const { services, bookings, daysOff, breaks, clock, today } = store;
  const service = computed(() => store.selectedService.value ?? undefined);
  const serviceId = computed({
    get: () => service.value?.id ?? 0,
    set: (id: number) => {
      const selected = services.value.find((item) => item.id === id);
      if (selected) store.selectService(selected);
    },
  });
  const daily = computed(() => service.value?.rentalUnit === 'day');
  const quantity = ref(daily.value ? 1 : 2);
  const guestCount = ref(4);
  const validGuests = computed(
    () =>
      Number.isInteger(guestCount.value) && guestCount.value >= 1 && guestCount.value <= MAX_GUESTS,
  );
  const maxQuantity = computed(() =>
    daily.value ? 30 : Math.floor((HOURS.end - HOURS.start) / (service.value?.duration || 60)),
  );
  const validQuantity = computed(
    () =>
      Number.isInteger(quantity.value) &&
      quantity.value >= 1 &&
      quantity.value <= maxQuantity.value,
  );
  const unitDuration = computed(() => (daily.value ? DAY_MINUTES : (service.value?.duration ?? 0)));
  const duration = computed(() => unitDuration.value * quantity.value);
  const totalPrice = computed(() =>
    service.value && validQuantity.value && validGuests.value
      ? rentalPrice(service.value, quantity.value, guestCount.value)
      : null,
  );
  const month = ref(today.value.slice(0, 7));
  const lastDate = computed(() => addDays(today.value, BOOKING_HORIZON_DAYS - 1));
  const selectedDate = ref('');
  const checkoutDate = ref('');
  const selectedTime = ref('');
  const hoverDate = ref('');
  const rangeError = ref('');
  const choosingEnd = computed(
    () => daily.value && Boolean(selectedDate.value) && !checkoutDate.value,
  );
  const monthLabel = computed(() =>
    new Date(`${month.value}-01T12:00:00Z`).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  );

  function slotsFor(date: string, amount = quantity.value): string[] {
    if (
      !service.value ||
      !isDateKey(date) ||
      date < today.value ||
      date > lastDate.value ||
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > maxQuantity.value
    )
      return [];
    return freeSlots({
      date,
      duration: unitDuration.value * amount,
      rentalUnit: service.value.rentalUnit,
      bookings: bookings.value,
      daysOff: daysOff.value,
      breaks: breaks.value,
      now: clock.value,
    });
  }

  function rangeSlots(first: string, second: string): string[] {
    if (!isDateKey(first) || !isDateKey(second)) return [];
    const range = normalizedRange(first, second);
    if (range.end > lastDate.value) return [];
    return slotsFor(range.start, range.quantity);
  }

  const hoverRange = computed(() =>
    choosingEnd.value && isDateKey(hoverDate.value)
      ? normalizedRange(selectedDate.value, hoverDate.value)
      : null,
  );
  const previewQuantity = computed(() => hoverRange.value?.quantity ?? 0);
  const previewValid = computed(() =>
    Boolean(hoverRange.value && rangeSlots(selectedDate.value, hoverDate.value).length),
  );
  const rangeStart = computed(() =>
    previewValid.value ? hoverRange.value!.start : selectedDate.value,
  );
  const rangeEnd = computed(() =>
    previewValid.value ? hoverRange.value!.end : checkoutDate.value,
  );
  const slots = computed(() => (selectedDate.value ? slotsFor(selectedDate.value) : []));
  // Hover changes only the highlight, keeping full calendar availability cached.
  const availableCalendarDays = computed(() =>
    monthDates(`${month.value}-01`).map((date) => {
      const inMonth = date.startsWith(month.value);
      const values = daily.value
        ? choosingEnd.value && date !== selectedDate.value
          ? rangeSlots(selectedDate.value, date)
          : slotsFor(date, 1)
        : slotsFor(date);
      const selectable =
        daily.value && choosingEnd.value && date === selectedDate.value ? true : values.length > 0;
      return { date, inMonth, slots: values, selectable, disabled: !inMonth || !selectable };
    }),
  );
  const calendar = computed(() =>
    availableCalendarDays.value.map((day) => {
      const { date } = day;
      const inRange = Boolean(
        rangeStart.value && rangeEnd.value && date > rangeStart.value && date < rangeEnd.value,
      );
      const isStart = selectedDate.value !== '' && date === rangeStart.value;
      const isEnd = rangeEnd.value !== '' && date === rangeEnd.value;
      return {
        ...day,
        isStart,
        isEnd,
        inRange,
        isPreview: previewValid.value && (inRange || isStart || isEnd),
      };
    }),
  );

  const endLabel = computed(() => {
    if (daily.value) return checkoutDate.value ? fullDate(checkoutDate.value) : '';
    if (!selectedDate.value || !selectedTime.value) return '';
    const end = new Date(
      Date.parse(`${selectedDate.value}T${selectedTime.value}:00+03:00`) + duration.value * 60_000,
    );
    return end.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Minsk',
    });
  });
  const requestDetails = computed(() =>
    [
      service.value?.name,
      validQuantity.value && `${quantity.value} ${daily.value ? 'сут.' : 'ч.'}`,
      validGuests.value && `${guestCount.value} чел.`,
      totalPrice.value !== null && `предварительно ${money(totalPrice.value)}`,
      selectedDate.value && `${daily.value ? 'заезд ' : ''}${fullDate(selectedDate.value)}`,
      daily.value
        ? checkoutDate.value && `выезд ${fullDate(checkoutDate.value)}`
        : selectedTime.value,
    ]
      .filter(Boolean)
      .join(', '),
  );

  function clearHover() {
    hoverDate.value = '';
  }
  function hoverDateAt(date: string) {
    hoverDate.value = choosingEnd.value && isDateKey(date) ? date : '';
  }
  function clearSelection() {
    selectedDate.value = '';
    checkoutDate.value = '';
    selectedTime.value = '';
    rangeError.value = '';
    clearHover();
  }
  let committingRange = false;
  function selectDate(date: string) {
    if (!isDateKey(date)) return;
    rangeError.value = '';
    if (!daily.value) {
      if (!slotsFor(date).length) return;
      selectedDate.value = date;
      selectedTime.value = '';
      return;
    }
    if (!choosingEnd.value) {
      if (!slotsFor(date, 1).length) return;
      selectedDate.value = date;
      checkoutDate.value = '';
      selectedTime.value = '';
      clearHover();
      return;
    }
    if (date === selectedDate.value) return;
    const range = normalizedRange(selectedDate.value, date);
    if (!rangeSlots(selectedDate.value, date).length) {
      rangeError.value =
        range.quantity > 30
          ? 'Можно выбрать не больше 30 суток.'
          : 'Этот период недоступен. Выберите другую дату выезда.';
      return;
    }
    committingRange = true;
    selectedDate.value = range.start;
    checkoutDate.value = range.end;
    quantity.value = range.quantity;
    committingRange = false;
    clearHover();
  }
  function moveMonth(delta: number) {
    const target = adjacentMonth(`${month.value}-01`, delta).slice(0, 7);
    if (target < today.value.slice(0, 7) || target > lastDate.value.slice(0, 7)) return;
    month.value = target;
    clearHover();
  }

  watch(
    [serviceId, daily],
    () => {
      clearSelection();
      quantity.value = daily.value ? 1 : 2;
    },
    { flush: 'sync' },
  );
  watch(
    quantity,
    () => {
      if (!daily.value || !selectedDate.value || committingRange) return;
      clearHover();
      const end = validQuantity.value ? addDays(selectedDate.value, quantity.value) : '';
      if (!end || !rangeSlots(selectedDate.value, end).length) {
        checkoutDate.value = '';
        rangeError.value =
          'Для выбранного срока нет свободного периода. Выберите другую дату выезда.';
        return;
      }
      checkoutDate.value = end;
      rangeError.value = '';
    },
    { flush: 'sync' },
  );
  watch(slots, (values) => {
    if (!values.includes(selectedTime.value)) selectedTime.value = '';
  });
  watch(
    [bookings, daysOff, breaks, clock, services],
    () => {
      if (
        daily.value &&
        checkoutDate.value &&
        !rangeSlots(selectedDate.value, checkoutDate.value).length
      ) {
        checkoutDate.value = '';
        clearHover();
        rangeError.value = 'Выбранный период стал недоступен. Выберите другие даты.';
      }
      if (
        selectedDate.value &&
        (selectedDate.value < today.value || selectedDate.value > lastDate.value)
      )
        clearSelection();
    },
    { deep: true },
  );

  return {
    services,
    today,
    serviceId,
    service,
    quantity,
    guestCount,
    validGuests,
    daily,
    maxQuantity,
    validQuantity,
    duration,
    totalPrice,
    month,
    lastDate,
    selectedDate,
    selectedTime,
    monthLabel,
    calendar,
    slots,
    endLabel,
    requestDetails,
    selectDate,
    moveMonth,
    checkoutDate,
    choosingEnd,
    hoverDate,
    previewQuantity,
    previewValid,
    rangeStart,
    rangeEnd,
    rangeError,
    hoverDateAt,
    clearHover,
    clearSelection,
    slotsFor,
  };
}
