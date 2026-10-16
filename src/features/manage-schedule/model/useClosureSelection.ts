import { computed, ref } from 'vue';
import {
  adjacentMonth,
  closureConflicts,
  isClosed,
  isDateKey,
  monthDates,
  type ClosedPeriod,
  type PracticeStore,
} from '../../../entities/practice/index.ts';

export function useClosureSelection(store: PracticeStore) {
  const kind = ref<ClosedPeriod['kind']>('Выходной');
  const start = ref('');
  const end = ref('');
  const month = ref(store.today.value);
  const hovered = ref('');
  const error = ref('');
  const saved = ref<Pick<ClosedPeriod, 'start' | 'end' | 'kind'> | null>(null);
  const choosingEnd = computed(() => kind.value === 'Отпуск' && !!start.value && !end.value);
  const selection = computed(() =>
    start.value && end.value ? { start: start.value, end: end.value, kind: kind.value } : null,
  );
  const range = computed(() => {
    const last = choosingEnd.value && hovered.value ? hovered.value : end.value || start.value;
    return { start: [start.value, last].sort()[0]!, end: [start.value, last].sort()[1]! };
  });
  const periodBookings = computed(() =>
    start.value
      ? closureConflicts(
          store.bookings.value,
          (date) => date >= start.value && date <= (end.value || start.value),
          store.today.value,
        )
      : [],
  );
  const overlappingPeriod = computed(() =>
    start.value
      ? store.breaks.value.find(
          (period) => period.start <= (end.value || start.value) && period.end >= start.value,
        )
      : undefined,
  );
  const regularDayOff = computed(
    () =>
      kind.value === 'Выходной' && !!start.value && isClosed(start.value, store.daysOff.value, []),
  );
  const canSubmit = computed(
    () =>
      store.isAdmin.value &&
      !!selection.value &&
      start.value >= store.today.value &&
      !periodBookings.value.length &&
      !overlappingPeriod.value &&
      !regularDayOff.value,
  );
  const days = computed(() =>
    monthDates(month.value).map((date) => ({
      date,
      past: date < store.today.value,
      outside: date.slice(0, 7) !== month.value.slice(0, 7),
      booked: closureConflicts(store.bookings.value, (key) => key === date, store.today.value)
        .length,
      closed: isClosed(date, store.daysOff.value, store.breaks.value),
      selected: !!start.value && date >= start.value && date <= (end.value || start.value),
      preview:
        choosingEnd.value &&
        !!hovered.value &&
        date >= range.value.start &&
        date <= range.value.end,
      edge: date === start.value || date === end.value,
    })),
  );
  const monthLabel = computed(() =>
    new Date(`${month.value}T12:00:00Z`).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  );
  const canMoveBack = computed(() => month.value.slice(0, 7) > store.today.value.slice(0, 7));

  function clear() {
    start.value = '';
    end.value = '';
    hovered.value = '';
    error.value = '';
  }
  function changeKind(value: ClosedPeriod['kind']) {
    if (kind.value === value) return;
    kind.value = value;
    end.value = value === 'Выходной' ? start.value : '';
    hovered.value = '';
    error.value = '';
    saved.value = null;
  }
  function selectDate(date: string) {
    if (!isDateKey(date) || date < store.today.value) return;
    error.value = '';
    saved.value = null;
    hovered.value = '';
    month.value = date;
    if (kind.value === 'Выходной') {
      start.value = date;
      end.value = date;
    } else if (!start.value || end.value) {
      start.value = date;
      end.value = '';
    } else {
      [start.value, end.value] = [start.value, date].sort();
    }
  }
  function previewDate(date: string) {
    hovered.value = choosingEnd.value && isDateKey(date) && date >= store.today.value ? date : '';
  }
  function moveMonth(delta: number) {
    if (delta < 0 && !canMoveBack.value) return;
    month.value = adjacentMonth(month.value, delta);
    hovered.value = '';
  }
  function submit() {
    if (!canSubmit.value || !selection.value) return;
    const period = { ...selection.value };
    store.addBreak(period);
    if (store.closureError.value) {
      error.value = store.closureError.value;
      return;
    }
    clear();
    saved.value = period;
  }
  return {
    kind,
    start,
    end,
    month,
    days,
    monthLabel,
    canMoveBack,
    choosingEnd,
    selection,
    periodBookings,
    overlappingPeriod,
    regularDayOff,
    canSubmit,
    error,
    saved,
    changeKind,
    selectDate,
    previewDate,
    moveMonth,
    clear,
    submit,
  };
}
