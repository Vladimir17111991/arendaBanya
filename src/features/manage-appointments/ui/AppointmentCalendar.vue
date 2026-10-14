<template>
  <section class="appointment-calendar card p-3 p-sm-4" aria-label="Календарь бронирований">
    <div class="appointment-calendar__toolbar mb-2">
      <button
        type="button"
        class="btn btn-light appointment-calendar__arrow"
        :aria-label="expanded || !mobile ? 'Предыдущий месяц' : 'Предыдущая неделя'"
        @click="move(-1)"
      >
        ‹
      </button>
      <h2 class="appointment-calendar__month fw-semibold mb-0" aria-live="polite">
        {{ monthLabel }}
      </h2>
      <button
        type="button"
        class="btn btn-light appointment-calendar__arrow"
        :aria-label="expanded || !mobile ? 'Следующий месяц' : 'Следующая неделя'"
        @click="move(1)"
      >
        ›
      </button>
    </div>
    <div class="appointment-calendar__grid" role="group" aria-label="Даты аренды">
      <span
        v-for="name in ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']"
        :key="name"
        class="appointment-calendar__weekday"
        >{{ name }}</span
      >
      <button
        v-for="day in days"
        :key="day.date"
        type="button"
        class="appointment-calendar__day"
        :class="{
          'appointment-calendar__day--selected': day.date === modelValue,
          'appointment-calendar__day--closed': day.closed,
          'appointment-calendar__day--outside': day.date.slice(0, 7) !== month.slice(0, 7),
          'appointment-calendar__day--today': day.date === today,
        }"
        :style="day.background ? { background: day.background, color: '#30253b' } : undefined"
        :aria-pressed="day.date === modelValue"
        :aria-current="day.date === today ? 'date' : undefined"
        :aria-label="`${fullDate(day.date)}${day.closed ? ', выходной' : ''}, броней: ${day.count}`"
        @click="select(day.date)"
      >
        {{ Number(day.date.slice(-2)) }}
      </button>
    </div>
    <div class="d-flex justify-content-between align-items-center mt-2">
      <button type="button" class="btn btn-link appointment-calendar__today" @click="select(today)">
        Сегодня
      </button>
      <button
        type="button"
        class="btn btn-link appointment-calendar__today d-lg-none"
        :aria-expanded="expanded"
        @click="toggleMonth"
      >
        {{ expanded ? 'Свернуть месяц ↑' : 'Весь месяц ↓' }}
      </button>
    </div>
    <div class="d-flex flex-wrap gap-3 mt-2 small text-muted appointment-calendar__legend">
      <span v-for="category in legend" :key="category.id"
        ><i
          class="appointment-calendar__key"
          :style="{ background: categoryColor(category.id) }"
        />{{ category.name }}</span
      >
      <span><i class="appointment-calendar__key appointment-calendar__key--closed" />Выходной</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  usePractice,
  monthDates,
  weekDates,
  adjacentMonth,
  addDays,
  isClosed,
  bookingDates,
} from '../../../entities/practice/index.ts';
import { categoryColor, categoryBackground } from '../model/categoryColor.ts';
import { fullDate } from '../../../shared/lib/format/index.ts';
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [date: string] }>();
const { today, daysOff, breaks, bookings, categories } = usePractice();
const month = ref(props.modelValue);
const expanded = ref(false);
const mobile = ref(false);
let media: MediaQueryList | undefined;
function updateViewport() {
  mobile.value = media?.matches ?? false;
}
onMounted(() => {
  media = window.matchMedia('(max-width: 991.98px)');
  updateViewport();
  media.addEventListener('change', updateViewport);
});
onUnmounted(() => media?.removeEventListener('change', updateViewport));
watch(
  () => props.modelValue,
  (date) => {
    month.value = date;
  },
);
const monthLabel = computed(() =>
  new Date(`${month.value}T12:00:00Z`).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }),
);
const legend = computed(() => {
  const entries = new Map(categories.value.map((item) => [item.id, item]));
  for (const item of bookings.value)
    if (item.status !== 'cancelled' && !entries.has(item.service.categoryId))
      entries.set(item.service.categoryId, {
        id: item.service.categoryId,
        name: item.service.category,
      });
  return [...entries.values()];
});
const days = computed(() =>
  (mobile.value && !expanded.value ? weekDates(props.modelValue) : monthDates(month.value)).map(
    (date) => ({
      date,
      closed: isClosed(date, daysOff.value, breaks.value),
      background: categoryBackground(
        bookings.value
          .filter((item) => bookingDates(item).includes(date) && item.status !== 'cancelled')
          .map((item) => item.service.categoryId),
      ),
      count: bookings.value.filter(
        (item) => bookingDates(item).includes(date) && item.status !== 'cancelled',
      ).length,
    }),
  ),
);
function select(date: string) {
  month.value = date;
  emit('update:modelValue', date);
}
function toggleMonth() {
  expanded.value = !expanded.value;
  month.value = props.modelValue;
}
function move(delta: number) {
  if (mobile.value && !expanded.value) select(addDays(props.modelValue, delta * 7));
  else month.value = adjacentMonth(month.value, delta);
}
</script>

<style scoped>
.appointment-calendar__toolbar {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 8px;
}
.appointment-calendar__month {
  font-size: 15px;
  text-align: center;
}
.appointment-calendar__month::first-letter {
  text-transform: uppercase;
}
.appointment-calendar {
  background: linear-gradient(145deg, #fff, #fcfbf1);
  box-shadow: var(--shadow-soft);
}
.appointment-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
}
.appointment-calendar__weekday {
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  padding: 8px 0;
}
.appointment-calendar__day {
  position: relative;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--ink);
  font-size: 14px;
  padding: 6px 0 11px;
  transition:
    background-color 180ms,
    color 180ms;
}
.appointment-calendar__day:hover {
  background: #e6ebd8;
}
.appointment-calendar__day--outside {
  color: #7f856d;
}
.appointment-calendar__day--closed {
  background: repeating-linear-gradient(135deg, #e8e8dc, #e8e8dc 3px, #f4f3e9 3px, #f4f3e9 6px);
}
.appointment-calendar__day--today {
  border-color: #7e8d59;
}
.appointment-calendar__day--selected,
.appointment-calendar__day--selected:hover {
  background: var(--brand);
  color: #fff;
  outline: 2px solid #753b92;
  outline-offset: -2px;
  font-weight: 700;
  box-shadow: 0 4px 10px #34462625;
}
.appointment-calendar__dot {
  position: absolute;
  bottom: 5px;
  left: calc(50% - 2px);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
}
.appointment-calendar__dot--visible {
  opacity: 1;
}
.appointment-calendar__arrow {
  min-height: 44px;
  width: 44px;
  padding: 0;
  font-size: 24px;
  border-radius: 12px;
}
.appointment-calendar__today {
  padding: 6px 12px;
  min-height: 40px;
  font-size: 12px;
}
.appointment-calendar__legend {
  font-size: 11px;
}
.appointment-calendar__key {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
}
.appointment-calendar__key--booked {
  background: var(--brand);
}
.appointment-calendar__key--closed {
  background: #dce1cc;
  border-radius: 2px;
}
</style>
