<template>
  <form @submit.prevent="save">
    <p class="weekly-schedule__hint">Отметьте дни, которые будут выходными каждую неделю.</p>
    <div class="weekly-schedule__days" role="group" aria-label="Регулярные выходные">
      <button
        v-for="day in weekdays"
        :key="day.id"
        type="button"
        class="weekly-schedule__day"
        :class="{ 'weekly-schedule__day--booked': weekdayBookings(day.id).length }"
        :aria-pressed="selected.includes(day.id)"
        :aria-label="`${day.name}: ${selected.includes(day.id) ? 'выходной' : 'рабочий день'}`"
        @click="toggle(day.id)"
      >
        <strong>{{ day.name }}</strong>
        <span>{{ selected.includes(day.id) ? 'выходной' : 'работаем' }}</span>
        <small v-if="weekdayBookings(day.id).length"
          >Брони: {{ weekdayBookings(day.id).length }}</small
        >
      </button>
    </div>
    <ClosureConflicts
      v-if="conflicts.length"
      :bookings="conflicts"
      @show-bookings="emit('show-bookings', $event)"
    />
    <p v-if="saved" class="alert practice-notice mt-3 mb-0" role="status">
      Регулярные выходные сохранены.
    </p>
    <BaseButton type="submit" pill class="closure-editor__save mt-3" :disabled="!canSave"
      >Сохранить</BaseButton
    >
  </form>
</template>

<script setup lang="ts">
import ClosureConflicts from './ClosureConflicts.vue';
import { computed, ref } from 'vue';
import {
  closureConflicts,
  usePractice,
  weekday,
  weekdays,
} from '../../../entities/practice/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';

const emit = defineEmits<{ 'show-bookings': [date: string] }>();
const { daysOff, bookings, today, isAdmin, toggleDayOff } = usePractice();
const selected = ref([...daysOff.value]);
const attempted = ref<number | null>(null);
const saved = ref(false);
const changes = computed(() =>
  weekdays.filter(({ id }) => selected.value.includes(id) !== daysOff.value.includes(id)),
);
const additions = computed(() => selected.value.filter((id) => !daysOff.value.includes(id)));
const pendingConflicts = computed(() =>
  closureConflicts(bookings.value, (date) => additions.value.includes(weekday(date)), today.value),
);
const conflicts = computed(() =>
  pendingConflicts.value.length
    ? pendingConflicts.value
    : attempted.value !== null
      ? weekdayBookings(attempted.value)
      : [],
);
const canSave = computed(
  () => isAdmin.value && changes.value.length > 0 && !pendingConflicts.value.length,
);

function weekdayBookings(day: number) {
  return closureConflicts(bookings.value, (date) => weekday(date) === day, today.value);
}
function toggle(day: number) {
  saved.value = false;
  attempted.value = null;
  if (selected.value.includes(day)) {
    selected.value = selected.value.filter((id) => id !== day);
  } else if (weekdayBookings(day).length) {
    attempted.value = day;
  } else {
    selected.value.push(day);
  }
}
function save() {
  if (!canSave.value) return;
  for (const day of changes.value) toggleDayOff(day.id);
  selected.value = [...daysOff.value];
  attempted.value = null;
  saved.value = true;
}
</script>

<style scoped>
.weekly-schedule__hint {
  margin: 16px 0;
  color: var(--muted);
  font-size: 14px;
}
.weekly-schedule__days {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.weekly-schedule__day {
  display: grid;
  align-content: center;
  gap: 5px;
  min-width: 0;
  min-height: 78px;
  padding: 10px 4px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface-soft);
  color: var(--ink);
}
.weekly-schedule__day span,
.weekly-schedule__day small {
  font-size: 12px;
}
.weekly-schedule__day--booked {
  background: #62492a;
  border-color: #b78c50;
  color: #ffe0a8;
}
.weekly-schedule__day[aria-pressed='true'] {
  background: var(--selected-bg);
  border-color: var(--focus);
  color: var(--selected-text);
}
.weekly-schedule__day:hover {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}
@media (max-width: 359.98px) {
  .weekly-schedule__days {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
