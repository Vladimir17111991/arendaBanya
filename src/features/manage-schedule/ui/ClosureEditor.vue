<template>
  <section class="closure-editor card">
    <h2 class="mb-2 fs-4 fw-semibold">Закрыть даты</h2>
    <p class="small text-body-secondary mb-3">
      Закройте отдельную дату, период или повторяющиеся дни.
    </p>
    <div class="closure-editor__kinds" role="group" aria-label="Причина закрытия">
      <button
        v-for="item in kinds"
        :key="item.name"
        type="button"
        :aria-pressed="mode === item.name"
        @click="changeMode(item.name)"
      >
        <strong>{{ item.name }}</strong
        ><span>{{ item.hint }}</span>
      </button>
    </div>
    <WeeklySchedule v-if="mode === 'Регулярно'" @show-bookings="emit('show-bookings', $event)" />
    <form v-else @submit.prevent="submit">
      <p class="closure-editor__instruction" role="status">{{ instruction }}</p>
      <div class="closure-calendar" aria-label="Календарь закрытия дат">
        <div class="closure-calendar__toolbar">
          <button
            type="button"
            aria-label="Предыдущий месяц закрытия дат"
            :disabled="!canMoveBack"
            @click="moveMonth(-1)"
          >
            ‹
          </button>
          <h3 aria-live="polite">{{ monthLabel }}</h3>
          <button type="button" aria-label="Следующий месяц закрытия дат" @click="moveMonth(1)">
            ›
          </button>
        </div>
        <div
          ref="calendar"
          class="closure-calendar__grid"
          role="group"
          aria-label="Выберите даты закрытия"
          @pointerleave="previewDate('')"
        >
          <span
            v-for="day in weekdays"
            :key="day.id"
            class="closure-calendar__weekday"
            aria-hidden="true"
            >{{ day.name }}</span
          >
          <button
            v-for="day in days"
            :key="day.date"
            type="button"
            :data-date="day.date"
            class="closure-calendar__day"
            :class="{
              'closure-calendar__day--outside': day.outside,
              'closure-calendar__day--booked': day.booked,
              'closure-calendar__day--closed': day.closed,
              'closure-calendar__day--selected': day.selected,
              'closure-calendar__day--preview': day.preview,
              'closure-calendar__day--edge': day.edge,
            }"
            :disabled="day.past"
            :aria-pressed="day.selected"
            :aria-current="day.date === today ? 'date' : undefined"
            :aria-label="dayLabel(day)"
            @click="selectDate(day.date)"
            @pointerenter="previewDate(day.date)"
            @focus="previewDate(day.date)"
            @blur="previewDate('')"
            @keydown="moveFocus($event, day.date)"
          >
            <span>{{ Number(day.date.slice(-2)) }}</span>
            <small v-if="day.booked" class="closure-calendar__booking" aria-hidden="true"
              >{{ day.booked }} бр.</small
            >
          </button>
        </div>
        <div class="closure-calendar__footer">
          <button type="button" class="closure-calendar__today" @click="month = today">
            К текущему месяцу
          </button>
          <div class="closure-calendar__legend" aria-label="Обозначения календаря">
            <span><i class="closure-calendar__key--booked" />Есть бронь</span>
            <span><i class="closure-calendar__key--closed" />Закрыто</span>
          </div>
        </div>
      </div>
      <div v-if="start" class="closure-editor__selection" aria-live="polite">
        <div>
          <span>{{ kind === 'Выходной' ? 'Выходной' : 'Начало отпуска' }}</span
          ><strong>{{ fullDate(start) }}</strong>
        </div>
        <div v-if="kind === 'Отпуск'">
          <span>Последний день</span
          ><strong>{{ end ? fullDate(end) : 'Выберите в календаре' }}</strong>
        </div>
        <button type="button" @click="clear">Сбросить</button>
      </div>
      <ClosureConflicts
        v-if="periodBookings.length"
        :bookings="periodBookings"
        @show-bookings="emit('show-bookings', $event)"
      />
      <p v-else-if="overlappingPeriod" class="alert practice-notice mt-3 mb-0" role="status">
        Уже закрыто: {{ shortDate(overlappingPeriod.start)
        }}<template v-if="overlappingPeriod.start !== overlappingPeriod.end">
          — {{ shortDate(overlappingPeriod.end) }}</template
        >. Изменить этот период можно в списке закрытых дат.
      </p>
      <p v-else-if="regularDayOff" class="alert practice-notice mt-3 mb-0" role="status">
        Этот день уже закрыт регулярным выходным.
      </p>
      <p v-if="error" class="alert alert-warning mt-3 mb-0" role="alert">{{ error }}</p>
      <p v-if="saved" class="alert practice-notice mt-3 mb-0" role="status">
        {{ saved.kind }} сохранён: {{ shortDate(saved.start)
        }}<template v-if="saved.start !== saved.end"> — {{ shortDate(saved.end) }}</template
        >.
      </p>
      <BaseButton type="submit" pill :disabled="!canSubmit" class="closure-editor__save mt-3"
        >Сохранить</BaseButton
      >
    </form>
  </section>
</template>

<script setup lang="ts">
import ClosureConflicts from './ClosureConflicts.vue';
import { computed, nextTick, ref } from 'vue';
import {
  addDays,
  usePractice,
  weekdays,
  type ClosedPeriod,
} from '../../../entities/practice/index.ts';
import { fullDate, shortDate } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
import { useClosureSelection } from '../model/useClosureSelection.ts';
import WeeklySchedule from './WeeklySchedule.vue';

const emit = defineEmits<{ 'show-bookings': [date: string] }>();
const store = usePractice();
const { today } = store;
const {
  kind,
  start,
  end,
  month,
  days,
  monthLabel,
  canMoveBack,
  choosingEnd,
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
} = useClosureSelection(store);
const calendar = ref<HTMLElement | null>(null);
type ClosureMode = ClosedPeriod['kind'] | 'Регулярно';
const mode = ref<ClosureMode>('Выходной');
const kinds: { name: ClosureMode; hint: string }[] = [
  { name: 'Выходной', hint: 'Один день' },
  { name: 'Отпуск', hint: 'Несколько дней' },
  { name: 'Регулярно', hint: 'Каждую неделю' },
];
function changeMode(value: ClosureMode) {
  mode.value = value;
  if (value !== 'Регулярно') changeKind(value);
}
const instruction = computed(() =>
  kind.value === 'Выходной'
    ? 'Нажмите на день, который хотите закрыть.'
    : choosingEnd.value
      ? 'Теперь выберите последний день отпуска — он тоже будет закрыт.'
      : end.value
        ? 'Период выбран включительно. Новый клик начнёт выбор заново.'
        : 'Нажмите на первый, затем на последний день отпуска.',
);
function dayLabel(day: (typeof days.value)[number]) {
  return `${fullDate(day.date)}${day.booked ? `, броней: ${day.booked}` : ''}${day.closed ? ', закрыто' : ''}${day.selected ? ', выбрано' : ''}`;
}
async function moveFocus(event: KeyboardEvent, date: string) {
  const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
  if (!offset || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  const target = addDays(date, offset);
  if (target < today.value) return;
  if (target.slice(0, 7) !== month.value.slice(0, 7)) month.value = target;
  await nextTick();
  calendar.value?.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)?.focus();
}
</script>

<style scoped>
.closure-editor {
  padding: 24px;
}
.closure-editor__kinds {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.closure-editor__kinds button {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 13px 10px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface-soft);
  color: var(--ink);
  text-align: left;
}
.closure-editor__kinds button[aria-pressed='true'] {
  background: var(--selected-bg);
  border-color: var(--focus);
  color: var(--selected-text);
}
.closure-editor__kinds span {
  font-size: 13px;
  opacity: 0.8;
}
.closure-editor :deep(.closure-editor__save.btn) {
  width: 240px;
  max-width: 100%;
  height: 54px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
}
.closure-editor__instruction {
  min-height: 42px;
  margin: 16px 0 10px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}
.closure-calendar {
  min-width: 0;
  user-select: none;
  -webkit-user-select: none;
}
.closure-calendar__toolbar {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.closure-calendar__toolbar h3 {
  margin: 0;
  font-size: 16px;
  text-align: center;
}
.closure-calendar__toolbar h3::first-letter {
  text-transform: uppercase;
}
.closure-calendar__toolbar button {
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--control-bg);
  color: var(--ink);
  font-size: 26px;
}
.closure-calendar__toolbar button:disabled {
  opacity: 0.35;
}
.closure-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}
.closure-calendar__weekday {
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  padding: 6px 0;
}
.closure-calendar__day {
  display: grid;
  align-content: center;
  gap: 1px;
  min-width: 0;
  min-height: 62px;
  padding: 5px 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--surface-soft);
  color: var(--ink);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.closure-calendar__day .closure-calendar__booking {
  justify-self: center;
  padding: 3px 5px;
  border-radius: 5px;
  background: #ffe0a8;
  color: #342410;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}
.closure-calendar__day--outside {
  color: var(--muted);
  background: transparent;
}
.closure-calendar__day[aria-current='date'] {
  border-color: var(--accent);
}
.closure-calendar__day--closed {
  background: repeating-linear-gradient(135deg, var(--control-bg) 0 3px, var(--surface) 3px 6px);
  color: var(--muted);
}
.closure-calendar__day--booked {
  background: #62492a;
  color: #ffe0a8;
  border-color: #b78c50;
}
.closure-calendar__day--selected,
.closure-calendar__day--preview {
  background: color-mix(in srgb, var(--selected-bg) 48%, var(--surface));
  color: var(--ink);
  border-color: var(--selected-bg);
}
.closure-calendar__day--preview {
  border-style: dashed;
}
.closure-calendar__day--edge {
  background: var(--selected-bg);
  color: var(--selected-text);
  border: 2px solid var(--focus);
  font-weight: 700;
}
.closure-calendar__day--booked:is(
  .closure-calendar__day--selected,
  .closure-calendar__day--preview
) {
  background: #62492a;
  color: #fff5e8;
  border-color: var(--focus);
}
.closure-calendar__day:hover:not(:disabled) {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}
.closure-calendar__day:disabled {
  opacity: 0.3;
}
.closure-calendar__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 14px;
  margin-top: 10px;
}
.closure-calendar__today {
  min-height: 44px;
  padding: 6px 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
}
.closure-calendar__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--muted);
  font-size: 12px;
}
.closure-calendar__legend span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.closure-calendar__legend i {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.closure-calendar__key--booked {
  background: #62492a;
  border: 1px solid #b78c50;
}
.closure-calendar__key--closed {
  background: repeating-linear-gradient(135deg, var(--control-bg) 0 3px, var(--surface) 3px 6px);
  border: 1px solid var(--line);
}
.closure-editor__selection {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface-soft);
}
.closure-editor__selection div {
  display: grid;
  gap: 5px;
  flex: 1;
  min-width: 140px;
}
.closure-editor__selection span {
  font-size: 12px;
  color: var(--muted);
}
.closure-editor__selection strong {
  font-size: 14px;
}
.closure-editor__selection button {
  min-height: 44px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
}
@media (max-width: 575.98px) {
  .closure-editor {
    padding: 16px;
  }
  .closure-calendar__grid {
    gap: 3px;
  }
  .closure-calendar__day {
    min-height: 56px;
    font-size: 14px;
  }
  .closure-calendar__day .closure-calendar__booking {
    padding: 3px 2px;
    font-size: 11px;
  }
  .closure-editor__kinds button {
    padding: 12px 6px;
    font-size: 13px;
  }
  .closure-editor__kinds {
    gap: 6px;
  }
  .closure-editor__kinds span {
    font-size: 11px;
  }
}
@media (max-width: 359.98px) {
  .closure-editor {
    padding: 12px;
  }
  .closure-editor__kinds button {
    font-size: 12px;
  }
  .closure-calendar__grid {
    gap: 2px;
  }
}
</style>
