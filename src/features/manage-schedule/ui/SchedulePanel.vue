<template>
  <aside class="grid gap-4 grid-cols-md-2 grid-cols-lg-1">
    <section class="card p-4">
      <p class="section-heading__kicker mb-3 small">ДОСТУПНОСТЬ БАНИ</p>
      <h2 class="mb-3 fs-4 fw-semibold">Дни для аренды</h2>
      <p class="mb-3 small text-body-secondary">
        Начало аренды с 10:00 до 19:00 (UTC+3). Отметьте дни, когда баня недоступна.
      </p>
      <div class="grid grid-cols-4 grid-cols-sm-7 grid-cols-md-4 grid-cols-xl-7 gap-1">
        <button
          v-for="day in weekdays"
          :key="day.id"
          class="btn rounded-2 border px-1 py-2 small"
          :class="
            daysOff.includes(day.id)
              ? 'border-warning-subtle bg-warning-subtle text-warning-emphasis'
              : 'bg-light text-success-emphasis'
          "
          :aria-pressed="daysOff.includes(day.id)"
          :aria-label="`${day.name}: ${daysOff.includes(day.id) ? 'выходной' : 'рабочий день'}`"
          @click="toggleDayOff(day.id)"
        >
          {{ day.name
          }}<small class="mt-1 d-block small">{{
            daysOff.includes(day.id) ? 'закрыто' : 'открыто'
          }}</small>
        </button>
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
            <label for="break-start" class="form-label mt-4 mb-2 d-block small fw-semibold">С</label
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
            <label for="break-end" class="form-label mt-4 mb-2 d-block small fw-semibold">По</label
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
        <BaseButton type="submit" class="mt-3 w-100">Закрыть даты</BaseButton>
      </form>
      <div v-if="closureError" class="alert alert-warning mt-3 small" role="alert">
        <p>{{ closureError }}</p>
        <ul v-if="conflicts.length" class="mt-3 ps-4">
          <li v-for="item in conflicts" :key="item.id">
            {{ shortDate(item.date) }} · {{ item.time }} · {{ item.name }}
          </li>
        </ul>
      </div>
    </section>
    <section class="card p-4 g-col-md-2 g-col-lg-1">
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
          variant="text"
          class="ps-0"
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
  addDays,
  usePractice,
  type ClosedPeriod,
} from '../../../entities/practice/index.ts';

import { fullDate, shortDate } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';

const { today, daysOff, breaks, conflicts, closureError, toggleDayOff, addBreak, removeBreak } =
  usePractice();
const start = ref(addDays(today.value, 1));
const end = ref(start.value);
const kind = ref<ClosedPeriod['kind']>('Отпуск');
const sortedBreaks = computed(() =>
  breaks.value.toSorted((a, b) => a.start.localeCompare(b.start)),
);
watch(start, (value) => {
  if (end.value < value) end.value = value;
});
function submit() {
  addBreak({ start: start.value, end: end.value, kind: kind.value });
}
</script>
