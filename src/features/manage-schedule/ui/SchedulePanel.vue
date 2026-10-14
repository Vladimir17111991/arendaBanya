<template>
  <aside class="schedule-panel">
    <section class="card p-4">
      <h2 class="mb-3 fs-4 fw-semibold">Дни для аренды</h2>
      <p class="mb-3 small text-body-secondary">
        Регулярные выходные повторяются каждую неделю. Для одного выходного выберите дату в блоке
        «Отпуск или выходной».
      </p>
      <div class="schedule-panel__week">
        <button
          v-for="day in weekdays"
          :key="day.id"
          type="button"
          class="schedule-panel__day"
          :class="{
            'schedule-panel__day--closed': daysOff.includes(day.id),
            'schedule-panel__day--booked': weekdayBookings(day.id).length > 0,
          }"
          :aria-pressed="daysOff.includes(day.id)"
          :aria-label="`${day.name}: ${daysOff.includes(day.id) ? 'выходной' : 'рабочий день'}`"
          @click="
            selectedWeekday = day.id;
            toggleDayOff(day.id);
          "
        >
          {{ day.name
          }}<small class="mt-1 d-block small">{{
            daysOff.includes(day.id) ? 'закрыто' : 'открыто'
          }}</small>
          <small v-if="weekdayBookings(day.id).length" class="d-block"
            >Брони: {{ weekdayBookings(day.id).length }}</small
          >
        </button>
      </div>
      <div
        v-if="selectedWeekday !== null && weekdayBookings(selectedWeekday).length"
        class="alert alert-warning mt-3 mb-0"
        role="status"
      >
        <strong>Есть брони — закрыть день нельзя</strong>
        <p class="small mt-2">Сначала согласуйте перенос или отмену с клиентами.</p>
        <ul class="ps-3 mb-0 small">
          <li v-for="item in weekdayBookings(selectedWeekday)" :key="item.id">
            {{ fullDate(item.date) }} · {{ item.time }} · {{ item.name }} · {{ item.service.name }}
          </li>
        </ul>
      </div>
    </section>
    <section class="card p-4">
      <h2 class="mb-3 fs-4 fw-semibold">Отпуск или выходной</h2>
      <p class="mb-3 small text-body-secondary">Закройте один день или период включительно.</p>
      <form @submit.prevent="submit">
        <label for="break-kind" class="form-label mt-4 mb-2 d-block small fw-semibold"
          >Причина</label
        ><select id="break-kind" v-model="kind" class="form-select">
          <option>Отпуск</option>
          <option>Выходной</option>
        </select>
        <div class="grid grid-cols-sm-2 gap-2">
          <div>
            <label for="break-start" class="form-label mt-4 mb-2 d-block small fw-semibold"
              >Первый день</label
            ><input
              id="break-start"
              v-model="start"
              class="px-2 small form-control"
              type="date"
              :min="today"
              required
            />
          </div>
          <div>
            <label for="break-end" class="form-label mt-4 mb-2 d-block small fw-semibold"
              >Последний день</label
            ><input
              id="break-end"
              v-model="end"
              class="px-2 small form-control"
              type="date"
              :min="start || today"
              required
            />
          </div>
        </div>
        <div v-if="periodBookings.length" class="alert alert-warning mt-3 mb-0" role="status">
          <strong>На выбранные даты есть брони: {{ periodBookings.length }}</strong>
          <ul class="ps-3 mt-2 small">
            <li v-for="item in periodBookings" :key="item.id">
              {{ fullDate(item.date) }} · {{ item.time }} · {{ item.name }} ·
              {{ item.service.name }}
            </li>
          </ul>
          <p class="small mb-0">Сначала согласуйте перенос или отмену с клиентами.</p>
        </div>
        <BaseButton type="submit" :disabled="periodBookings.length > 0" class="mt-3 w-100"
          >Закрыть даты</BaseButton
        >
      </form>
      <div
        v-if="closureError && selectedWeekday === null && !periodBookings.length"
        class="alert alert-warning mt-3 small"
        role="alert"
      >
        <p>{{ closureError }}</p>
        <ul v-if="conflicts.length" class="mt-3 ps-4">
          <li v-for="item in conflicts" :key="item.id">
            {{ shortDate(item.date) }} · {{ item.time }} · {{ item.name }}
          </li>
        </ul>
      </div>
    </section>
    <section class="card p-4 schedule-panel__periods">
      <h2 class="mb-3 fs-4 fw-semibold">Закрытые периоды</h2>
      <p v-if="!breaks.length" class="small text-body-secondary">
        Пока действуют только регулярные выходные.
      </p>
      <div v-for="item in sortedBreaks" :key="item.id" class="mt-3 border-top pt-3">
        <strong>{{ item.kind }}</strong>
        <p class="my-1 small">
          {{ fullDate(item.start)
          }}<template v-if="item.end !== item.start"> — {{ fullDate(item.end) }}</template>
        </p>
        <BaseButton
          variant="secondary"
          :aria-label="`Открыть даты: ${fullDate(item.start)}`"
          @click="removeBreak(item.id)"
          >Открыть даты</BaseButton
        >
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  weekdays,
  weekday,
  closureConflicts,
  addDays,
  usePractice,
  type ClosedPeriod,
} from '../../../entities/practice/index.ts';

import { fullDate, shortDate } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';

const {
  bookings,
  today,
  daysOff,
  breaks,
  conflicts,
  closureError,
  toggleDayOff,
  addBreak,
  removeBreak,
} = usePractice();
const start = ref(addDays(today.value, 1));
const end = ref(start.value);
const kind = ref<ClosedPeriod['kind']>('Отпуск');
const selectedWeekday = ref<number | null>(null);
function weekdayBookings(day: number) {
  return closureConflicts(bookings.value, (date) => weekday(date) === day, today.value);
}
const periodBookings = computed(() =>
  closureConflicts(bookings.value, (date) => date >= start.value && date <= end.value, today.value),
);
const sortedBreaks = computed(() =>
  breaks.value.toSorted((a, b) => a.start.localeCompare(b.start)),
);
watch(start, (value) => {
  if (end.value < value) end.value = value;
});
function submit() {
  selectedWeekday.value = null;
  addBreak({ start: start.value, end: end.value, kind: kind.value });
}
</script>
<style scoped>
.schedule-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}
.schedule-panel > * {
  min-width: 0;
}
.schedule-panel__week {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
  gap: 10px;
}
.schedule-panel__day {
  min-width: 0;
  min-height: 76px;
  padding: 12px 6px;
  border: 1px solid #c6a8d6;
  border-radius: 14px;
  background: #f3ecf8;
  color: #59336d;
  font-size: 16px;
  font-weight: 600;
  transition:
    background 160ms,
    border-color 160ms;
}
.schedule-panel__day small {
  font-weight: 400;
  font-size: 13px;
}
.schedule-panel__day:hover {
  background: #e9d9f2;
  border-color: #753b92;
}
.schedule-panel__day--booked {
  background: #fff0d8;
  border-color: #c69239;
  color: #6b4615;
}
.schedule-panel__day--closed {
  background: #f9e9ed;
  color: #8b354d;
  border-color: #dfafbd;
}
.schedule-panel__day--closed:hover {
  background: #f2d7df;
}
.schedule-panel__day:focus-visible {
  outline: 3px solid #a778be;
  outline-offset: 3px;
}
.schedule-panel__periods {
  grid-column: 1 / -1;
}
@media (max-width: 767.98px) {
  .schedule-panel {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .schedule-panel__week {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (min-width: 1200px) {
  .schedule-panel__week {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }
}
@media (max-width: 575.98px) {
  .schedule-panel__day small {
    font-size: 12px;
  }
  .schedule-panel__week {
    gap: 6px;
  }
}
@media (max-width: 359.98px) {
  .schedule-panel__week {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
