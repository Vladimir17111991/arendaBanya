<template>
  <section class="availability" tabindex="-1" aria-labelledby="availability-title">
    <div class="container">
      <h2 id="availability-title" class="visually-hidden">Свободные даты и расчёт стоимости</h2>
      <div class="availability__dialog-heading">
        <h2 :id="titleId" class="availability__dialog-title" tabindex="-1">{{ title }}</h2>
        <DialogClose label="Закрыть календарь" @click="emit('close')" />
      </div>
      <div v-if="services.length" class="availability__layout">
        <div class="availability__calendar">
          <div class="availability__controls">
            <div class="availability__settings">
              <NumberStepper
                v-if="!daily"
                id="public-quantity"
                v-model="quantity"
                label="Часы"
                :min="1"
                :max="maxQuantity"
                suffix="ч."
                @update:model-value="revealEstimate(true)"
              />
              <NumberStepper
                id="public-guests"
                v-model="guestCount"
                :class="{ 'availability__guests--single': daily }"
                label="Гости"
                :min="1"
                :max="MAX_GUESTS"
                suffix="чел."
                @update:model-value="revealEstimate(true)"
              />
            </div>
            <div v-if="daily" class="availability__period">
              <div class="availability__period-dates">
                <div :class="{ 'availability__period-date--active': !selectedDate }">
                  <span>Заезд</span>
                  <strong>{{ rangeStart ? shortDate(rangeStart) : '—' }}</strong>
                </div>
                <span class="availability__period-arrow" aria-hidden="true">→</span>
                <div :class="{ 'availability__period-date--active': choosingEnd }">
                  <span>Выезд</span>
                  <strong>{{ rangeEnd ? shortDate(rangeEnd) : '—' }}</strong>
                </div>
              </div>
              <div class="availability__period-footer">
                <p id="public-range-help" class="availability__range-help" aria-live="polite">
                  {{ rangeHint }}
                </p>
                <button
                  type="button"
                  class="availability__reset"
                  :disabled="!selectedDate"
                  @click="clearSelection"
                >
                  Сбросить даты
                </button>
              </div>
            </div>
            <AvailabilitySummary
              v-if="desktop"
              :price="displayedPrice"
              :rate="service?.price"
              :quantity="displayedQuantity"
              :guests="guestCount"
              :daily="daily"
              :details="requestDetails"
            />
          </div>
          <div class="availability__month-view">
            <CalendarStage
              class="availability__month-stage"
              :month="month"
              :direction="monthDirection"
            >
              <template #header>
                <div class="availability__month-nav">
                  <button
                    type="button"
                    class="availability__arrow"
                    :disabled="month <= today.slice(0, 7)"
                    aria-label="Предыдущий месяц"
                    @click="changeMonth(-1)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path d="m14 6-6 6 6 6" />
                    </svg>
                  </button>
                  <h3 class="availability__month" aria-live="polite">
                    <span>{{ monthName }}</span>
                    <small>{{ month.slice(0, 4) }}</small>
                  </h3>
                  <button
                    type="button"
                    class="availability__arrow"
                    :disabled="month >= lastDate.slice(0, 7)"
                    aria-label="Следующий месяц"
                    @click="changeMonth(1)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path d="m10 6 6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </template>
              <div
                class="availability__grid"
                :class="{ 'availability__grid--daily': daily }"
                @pointerdown="beginDrag"
                @pointermove="moveDrag"
                @pointerup="endDrag"
                @pointercancel="cancelDrag"
                @lostpointercapture="cancelDrag"
                @pointerleave="!drag.active && clearHover()"
              >
                <span
                  v-for="day in ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']"
                  :key="day"
                  class="availability__weekday"
                  >{{ day }}</span
                >
                <button
                  v-for="day in calendar"
                  :key="day.date"
                  type="button"
                  class="availability__day"
                  :class="{
                    'availability__day--available': day.selectable,
                    'availability__day--selected': day.isStart || day.isEnd,
                    'availability__day--range': day.inRange,
                    'availability__day--start': daily && day.isStart && !!rangeEnd,
                    'availability__day--end': daily && day.isEnd,
                    'availability__day--preview': day.isPreview,
                    'availability__day--outside': !day.inMonth,
                  }"
                  :disabled="!day.selectable || !day.inMonth"
                  :aria-pressed="day.isStart || day.isEnd || day.inRange"
                  :aria-label="dateLabel(day)"
                  :aria-describedby="daily ? 'public-range-help' : undefined"
                  :data-date="day.date"
                  @pointerenter="hoverDateAt(day.date)"
                  @focus="hoverDateAt(day.date)"
                  @blur="clearHover"
                  @click="chooseDate(day.date, $event)"
                >
                  <span class="availability__day-number">{{ Number(day.date.slice(-2)) }}</span
                  ><span
                    v-if="
                      day.selectable && day.inMonth && !day.inRange && !day.isStart && !day.isEnd
                    "
                    class="availability__dot"
                    aria-hidden="true"
                  ></span>
                </button>
              </div>
            </CalendarStage>
            <AvailabilityTimes
              v-if="desktop && !daily"
              class="availability__inline-times"
              :date="selectedDate"
              :slots="slots"
              :quantity="quantity"
            />
            <div v-if="!daily && !desktop" class="availability__legend">
              <span class="availability__legend-dot"></span>
              {{
                daily
                  ? 'Проведите от заезда до выезда или нажмите две даты'
                  : 'Есть свободное время для выбранного срока'
              }}
            </div>
            <p v-if="daily && rangeError" class="availability__range-error" role="status">
              {{ rangeError }}
            </p>
            <p v-if="!validQuantity" class="small text-danger mt-3" role="alert">
              Укажите целое число от 1 до {{ maxQuantity }}.
            </p>
            <p v-if="!validGuests" class="small text-danger mt-3" role="alert">
              Укажите количество гостей от 1 до {{ MAX_GUESTS }}.
            </p>
            <p
              v-if="validQuantity && !calendar.some((day) => day.inMonth && day.selectable)"
              class="small mt-3"
              role="status"
            >
              В этом месяце нет свободного времени для выбранного срока. Попробуйте другой месяц или
              срок аренды.
            </p>
          </div>
        </div>
      </div>
      <p v-else class="availability__intro">
        Расписание появится после добавления вариантов аренды. Уточните доступные даты по телефону.
      </p>
    </div>
    <div v-if="!desktop" class="availability__estimate-dock">
      <button
        v-if="!estimateVisible"
        type="button"
        class="availability__estimate-trigger"
        @click="openEstimate"
      >
        Показать расчёт
      </button>
      <AvailabilityEstimate
        :visible="estimateVisible && active"
        :expanded="estimateExpanded"
        :price="displayedPrice"
        :rate="service?.price"
        :quantity="displayedQuantity"
        :guests="guestCount"
        :daily="daily"
        :start="selectedDate"
        :end="checkoutDate"
        :has-times="slots.length > 0"
        :details="requestDetails"
        @toggle="toggleEstimate"
        @show-times="timeSheet = true"
      />
    </div>
    <MediaDialog
      :open="timeSheet"
      class="time-sheet"
      title="Доступное время"
      @close="timeSheet = false"
    >
      <p class="time-sheet__date">{{ selectedDate ? fullDate(selectedDate) : '' }}</p>
      <p class="time-sheet__summary">
        {{ quantity }} ч. · Гостей: {{ guestCount }} · {{ money(totalPrice ?? 0) }}
      </p>
      <ul class="availability__slots" aria-label="Свободные интервалы">
        <li v-for="time in slots" :key="time" class="availability__slot">
          {{ time }}–{{ slotEnd(time) }}
        </li>
      </ul>
      <p v-if="!slots.length" role="status">
        Свободного времени на эту дату нет. Выберите другую дату.
      </p>
      <p class="time-sheet__selection" aria-live="polite">
        Варианты начала и окончания аренды.<br />Точное время согласуйте по телефону.
      </p>
      <button type="button" class="btn btn-primary section-button" @click="timeSheet = false">
        Закрыть
      </button>
    </MediaDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { MAX_GUESTS, rentalPrice, usePractice } from '../../../entities/practice/index.ts';
import { NumberStepper, MediaDialog, DialogClose } from '../../../shared/ui/index.ts';
import { fullDate, shortDate, money } from '../../../shared/lib/format/index.ts';
import { usePublicAvailability } from '../model/usePublicAvailability.ts';
import CalendarStage from './CalendarStage.vue';
import { createDateDrag } from '../model/dateDrag.ts';
import { useEstimateDrawer } from '../model/useEstimateDrawer.ts';
import AvailabilityEstimate from './AvailabilityEstimate.vue';
import AvailabilitySummary from './AvailabilitySummary.vue';
import AvailabilityTimes from './AvailabilityTimes.vue';

const props = withDefaults(defineProps<{ active?: boolean; title: string; titleId: string }>(), {
  active: true,
});
const {
  visible: estimateVisible,
  expanded: estimateExpanded,
  reveal: revealEstimate,
  toggle: toggleEstimate,
  open: openEstimate,
  reset: resetEstimate,
} = useEstimateDrawer();

const {
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
  totalPrice,
  month,
  lastDate,
  selectedDate,
  calendar,
  slots,
  requestDetails,
  selectDate,
  moveMonth,
  checkoutDate,
  choosingEnd,
  previewQuantity,
  previewValid,
  rangeStart,
  rangeEnd,
  rangeError,
  hoverDateAt,
  clearHover,
  clearSelection,
} = usePublicAvailability(usePractice());

function slotEnd(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return (
    String((hours! + quantity.value) % 24).padStart(2, '0') + ':' + String(minutes).padStart(2, '0')
  );
}
const timeSheet = ref(false);
const desktop = ref(false);
let desktopQuery: MediaQueryList | undefined;
function updateDesktop() {
  desktop.value = desktopQuery?.matches ?? false;
  if (desktop.value) timeSheet.value = false;
}
onMounted(() => {
  desktopQuery = window.matchMedia('(min-width: 992px)');
  updateDesktop();
  desktopQuery.addEventListener('change', updateDesktop);
});
onUnmounted(() => desktopQuery?.removeEventListener('change', updateDesktop));
watch(
  [() => props.active, serviceId],
  () => {
    resetEstimate();
    timeSheet.value = false;
  },
  { flush: 'sync' },
);
watch([selectedDate, checkoutDate], () => {
  if (props.active && selectedDate.value) revealEstimate(Boolean(checkoutDate.value));
});
const drag = createDateDrag({ clearSelection, selectDate, hoverDateAt, clearHover });
function dateButton(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLButtonElement>('button[data-date]:not(:disabled)')
    : null;
}
function beginDrag(event: PointerEvent) {
  if (!daily.value || !event.isPrimary || event.button !== 0) return;
  const date = dateButton(event.target)?.dataset.date;
  if (!date) return;
  drag.begin({ id: event.pointerId, x: event.clientX, y: event.clientY }, date);
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function moveDrag(event: PointerEvent) {
  if (!drag.active) return;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const date =
    dateButton(target)?.dataset.date ??
    (target?.closest('.availability__grid') === event.currentTarget &&
    !target?.closest('button[data-date]')
      ? undefined
      : '');
  drag.move({ id: event.pointerId, x: event.clientX, y: event.clientY }, date);
}
function endDrag(event: PointerEvent) {
  drag.end(event.pointerId);
}
function cancelDrag() {
  drag.cancel();
}
function chooseDate(date: string, event: MouseEvent) {
  if (drag.ignoreClick(event.detail)) return;
  selectDate(date);
  if (!daily.value && !desktop.value && selectedDate.value === date) timeSheet.value = true;
}
watch(serviceId, () => {
  cancelDrag();
  timeSheet.value = false;
});
const monthDirection = ref(1);
const monthName = computed(() =>
  new Date(`${month.value}-01T12:00:00Z`).toLocaleDateString('ru-RU', {
    month: 'long',
    timeZone: 'UTC',
  }),
);
function changeMonth(direction: -1 | 1) {
  monthDirection.value = direction;
  moveMonth(direction);
}

const emit = defineEmits<{ selectionDetails: [details: string]; close: [] }>();
watch(requestDetails, (details) => emit('selectionDetails', details), { immediate: true });
function dayWord(value: number) {
  return value % 10 === 1 && value % 100 !== 11 ? 'сутки' : 'суток';
}
const rangeHint = computed(() => {
  if (previewValid.value)
    return `${previewQuantity.value} ${dayWord(previewQuantity.value)} · нажмите дату выезда`;
  if (choosingEnd.value) return 'Выберите дату выезда.';
  if (checkoutDate.value)
    return `${quantity.value} ${dayWord(quantity.value)} · можно выбрать новый период`;
  return 'Выберите заезд и выезд.';
});
const displayedQuantity = computed(() =>
  daily.value && previewValid.value ? previewQuantity.value : quantity.value,
);
const displayedPrice = computed(() =>
  daily.value && previewValid.value && service.value && validGuests.value
    ? rentalPrice(service.value, displayedQuantity.value, guestCount.value)
    : totalPrice.value,
);
function dateLabel(day: (typeof calendar.value)[number]) {
  const status = day.isStart
    ? 'заезд'
    : day.isEnd
      ? 'выезд'
      : day.inRange
        ? 'в выбранном периоде'
        : day.selectable
          ? daily.value && choosingEnd.value
            ? 'доступна для выбора периода'
            : 'есть свободное время'
          : 'недоступно';
  return `${fullDate(day.date)}: ${status}${day.isPreview ? ', предварительный выбор' : ''}`;
}
</script>

<style scoped>
.availability > .container {
  padding: 0;
}

.availability {
  background: transparent;
  color: var(--ink, #fff5e8);
  font-size: 16px;
  line-height: 1.65;
}
.availability__estimate-dock {
  display: grid;
  place-items: center;
  position: sticky;
  bottom: 0;
  z-index: 3;
  height: 86px;
  margin-top: 20px;
}
.availability__dialog-heading {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  background: var(--surface);
}
.availability__dialog-title {
  margin: 0;
  color: var(--ink);
  font: 400 26px/1.2 var(--display);
}
.availability__dialog-title:focus {
  outline: none;
}
.availability__estimate-trigger {
  display: block;
  min-height: 44px;
  margin: 0 auto;
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.availability .small {
  font-size: 14px;
}
.availability__heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 32px;
  margin-bottom: 34px;
}
.availability__title {
  font: 400 clamp(34px, 4vw, 54px)/1.15 var(--display);
  letter-spacing: -0.035em;
  margin: 0;
}
.availability__intro {
  max-width: 400px;
  color: var(--muted);
  line-height: 1.8;
  margin: 0;
  font-size: 16px;
}
.availability__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  max-width: 720px;
  margin-inline: auto;
  gap: 24px;
}
.availability__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
}
.availability__steps li {
  display: flex;
  gap: 14px;
  align-items: start;
  padding-top: 18px;
  border-top: 1px solid var(--line, #70543e);
}
.availability__steps li > span {
  color: var(--accent, #deb989);
  font: italic 24px/1.2 var(--display);
}
.availability__steps strong {
  font-weight: 500;
  font-size: 16px;
}
.availability__steps p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--muted);
  margin: 6px 0 0;
}
.availability__calendar {
  min-width: 0;
}
.availability__controls {
  min-width: 0;
}
.availability__month-view {
  min-width: 0;
}
.availability__inline-times {
  margin-top: 12px;
}
.availability__settings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  font-size: 16px;
}
.availability__rental-setting {
  grid-column: 1 / -1;
  min-width: 0;
}
.availability__guests--single {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.availability__guests--single :deep(.number-stepper__heading) {
  display: grid;
  gap: 4px;
  margin-bottom: 0;
}
.availability__guests--single :deep(.number-stepper__controls) {
  width: 200px;
  flex-shrink: 0;
}
.availability__rental-label {
  float: none;
  font-size: 16px;
  margin-bottom: 10px;
}
.availability__formats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.availability__format {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  min-width: 0;
  min-height: 100px;
  border: 1px solid var(--line, #70543e);
  border-radius: 16px;
  background: var(--surface-soft, #3b2e23);
  cursor: pointer;
  color: var(--brand);
}
.availability__format--selected {
  background: var(--control-bg, #443427);
  border-color: var(--accent, #deb989);
  box-shadow: inset 0 0 0 1px var(--accent, #deb989);
}
.availability__format:has(input:focus-visible) {
  outline: 3px solid var(--focus, #e2be8d);
  outline-offset: 3px;
}
.availability__format strong {
  font-weight: 500;
  font-size: 16px;
  padding-right: 25px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.availability__format > span:last-child {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.6;
}
.availability__format-check {
  position: absolute;
  right: 16px;
  top: 18px;
  width: 22px;
  height: 22px;
  border: 2px solid var(--muted);
  border-radius: 50%;
  color: transparent;
  font-size: 0;
}
.availability__format--selected .availability__format-check::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: white;
}
.availability__format--selected .availability__format-check {
  color: var(--selected-text, #fff);
  background: var(--selected-bg, #8d623d);
  border-color: var(--accent, #deb989);
}
.availability__period {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid var(--line, #70543e);
}
.availability__period-dates {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
}
.availability__period-dates > div {
  min-width: 0;
  padding: 12px 14px;
  background: var(--surface-soft, #3b2e23);
  border: 1px solid var(--line, #70543e);
  border-radius: 14px;
}
.availability__period-dates > .availability__period-date--active {
  border-color: var(--accent, #deb989);
  background: var(--control-bg, #443427);
}
.availability__period-dates span:not(.availability__period-arrow) {
  display: block;
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 5px;
}
.availability__period-dates strong {
  display: block;
  color: var(--brand);
  font-size: 16px;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.availability__period-arrow {
  color: var(--accent, #deb989);
  font-size: 20px;
}
.availability__period-footer {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}
.availability__range-help {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  min-height: 3.2em;
  display: grid;
  align-items: center;
  text-align: center;
}
.availability__reset {
  justify-self: center;
  min-height: 44px;
  padding: 9px 16px;
  border: 1px solid var(--accent, #deb989);
  border-radius: 12px;
  background: var(--control-bg, #443427);
  color: var(--brand);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}
.availability__reset:disabled {
  opacity: 0.45;
  cursor: default;
}
.availability__range-error {
  margin: 14px 0 0;
  color: var(--accent, #deb989);
  font-size: 14px;
  line-height: 1.6;
}
.availability__month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.availability__month {
  margin: 0;
  font-family: var(--display);
  font-size: clamp(26px, 2.8vw, 34px);
  font-weight: 400;
  text-align: center;
  text-transform: capitalize;
  color: var(--ink);
  text-shadow: 0 2px 18px #dfd2c425;
}
.availability__month small {
  display: block;
  margin-top: 4px;
  font-family: 'Manrope', Arial, sans-serif;
  font-size: 14px;
  letter-spacing: 0.18em;
  color: var(--accent);
}
.availability__arrow {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(145deg, #695139, #443427);
  border: 1px solid var(--line, #70543e);
  color: var(--brand);
  font-size: 22px;
  box-shadow:
    inset 0 1px 0 #efece930,
    0 4px 0 #24201d,
    0 8px 14px #15121050;
  transition:
    transform 180ms,
    box-shadow 180ms;
}
.availability__arrow:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow:
    inset 0 1px 0 #efece930,
    0 1px 0 #24201d;
}
.availability__arrow:disabled {
  opacity: 0.45;
}
.availability__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px 0;
}
.availability__weekday {
  text-align: center;
  font-size: 16px;
  color: var(--muted);
  padding: 4px 0 10px;
}
.availability__day {
  display: grid;
  place-content: center;
  position: relative;
  min-height: 54px;
  min-width: 0;
  padding: 4px 0;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  color: var(--muted, #cbb8a4);
  margin: 0 3px;
  transition:
    transform 180ms,
    box-shadow 180ms,
    background-color 180ms;
}
.availability__day-number {
  position: relative;
  z-index: 1;
}
.availability__day--available {
  color: var(--ink, #fff5e8);
  background: linear-gradient(145deg, #624b35, #3f3832);
  border-color: #c1a78d45;
  transform: none;
  box-shadow:
    inset 0 1px 0 #eeeae625,
    0 4px 0 #231f1c,
    0 7px 10px #15121055;
}
.availability__day--available:hover {
  border-color: var(--accent, #deb989);
  background: linear-gradient(145deg, #806245, #443c35);
  box-shadow:
    inset 0 1px 0 #f5f2f070,
    0 4px 0 #231f1c,
    0 0 18px #b98b5935;
}
.availability__day--available:active {
  transform: none;
  box-shadow:
    inset 0 1px 0 #f5f2f070,
    0 1px 0 #231f1c;
}
.availability__day--range {
  margin-inline: 0;
  border-radius: 0;
  color: var(--ink, #fff5e8);
  background: linear-gradient(180deg, #7b5f42, #55422e);
  border-inline-color: transparent;
  border-block-color: #bfa48977;
  transform: none;
  box-shadow:
    inset 0 1px 0 #dfd2c430,
    0 4px 0 #332d28;
}
.availability__day--start {
  margin-right: 0;
  border-radius: 12px 0 0 12px;
}
.availability__day--end {
  margin-left: 0;
  border-radius: 0 12px 12px 0;
}
.availability__day--preview.availability__day--range {
  background: var(--control-bg, #443427);
  box-shadow: inset 0 -3px var(--accent, #deb989);
}
.availability__day--selected {
  color: var(--selected-text, #fff);
  background: linear-gradient(145deg, #b69777, #754e31);
  border-color: #e4d8cc;
  transform: none;
  box-shadow:
    inset 0 1px 0 #f2efedb0,
    0 5px 0 #453225,
    0 0 22px #c9b29a57;
  font-weight: 700;
}
.availability__day--selected:hover {
  background: linear-gradient(145deg, #c1a78d, #895f3b);
}
.availability__day--range:hover {
  background: linear-gradient(180deg, #967451, #6b523a);
}
.availability__day:focus-visible,
.availability__reset:focus-visible,
.availability__arrow:focus-visible {
  outline: 3px solid var(--focus, #e2be8d);
  outline-offset: 2px;
  z-index: 2;
}
.availability__day:disabled {
  cursor: not-allowed;
  color: #c2a88e;
}
.availability__day--outside {
  opacity: 0.45;
}
.availability__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  position: absolute;
  bottom: 6px;
  left: calc(50% - 2px);
}
.availability__legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--muted);
  margin-top: 18px;
}
.availability__legend-dot {
  width: 7px;
  height: 7px;
  background: var(--accent, #deb989);
  border-radius: 50%;
  flex-shrink: 0;
}
.availability__slots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 430px;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  user-select: none;
  -webkit-user-select: none;
}
.availability__slot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 calc((100% - 16px) / 3);
  min-height: 48px;
  min-width: 0;
  border: 1px solid var(--line, #70543e);
  border-radius: 10px;
  background: var(--control-bg, #443427);
  padding: 10px 6px;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--brand);
}
.availability__reset:hover:not(:disabled),
.availability__arrow:hover:not(:disabled) {
  border-color: var(--accent, #deb989);
  background: var(--selected-bg, #8d623d);
  color: var(--selected-text, #fff);
}
@media (max-width: 991.98px) {
  .availability__heading {
    display: block;
  }
  .availability__intro {
    max-width: 620px;
    margin-top: 18px;
  }
  .availability__guests--single {
    display: block;
  }
  .availability__guests--single :deep(.number-stepper__heading) {
    display: flex;
    margin-bottom: 12px;
  }
  .availability__guests--single :deep(.number-stepper__controls) {
    width: 100%;
  }
  .availability__layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .availability__calendar {
    padding: 20px;
  }
  .availability__settings {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 767.98px) {
  .availability__heading {
    display: block;
  }
  .availability__intro {
    margin-top: 18px;
  }
  .availability__layout {
    grid-template-columns: 1fr;
  }
  .availability__settings {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 575.98px) {
  .availability__steps {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .availability__steps li {
    padding-top: 12px;
  }
  .availability__steps p {
    margin-top: 3px;
  }
  .availability__format {
    padding: 16px;
  }
  .availability__format strong {
    font-size: 16px;
  }
  .availability__formats {
    grid-template-columns: minmax(0, 1fr);
  }
  .availability__settings {
    grid-template-columns: 1fr;
  }
  .availability__period-dates {
    gap: 8px;
  }
  .availability__period-dates > div {
    padding: 12px;
  }
}
@media (max-width: 399.98px) {
  .availability__period-dates strong {
    min-height: 3.3em;
  }
  .availability__settings {
    grid-template-columns: 1fr;
  }
  .availability__calendar {
    padding: 14px;
  }
  .availability__grid {
    gap: 3px 0;
  }
  .availability__day {
    min-height: 48px;
    margin-inline: 1px;
  }
  .availability__day--range {
    margin-inline: 0;
  }
  .availability__day--start {
    margin-right: 0;
  }
  .availability__day--end {
    margin-left: 0;
  }
  .availability__month {
    font-size: 25px;
  }
  .availability__stay > div {
    flex-direction: column;
    gap: 4px;
  }
  .availability__stay dd {
    text-align: left;
  }
}
@media (max-width: 575.98px), (prefers-reduced-motion: reduce) {
  .availability__day--available,
  .availability__day--range,
  .availability__day--selected {
    transform: none;
  }
}

.availability__grid--daily .availability__day:not(:disabled) {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.availability__day--available,
.availability__day--available:hover,
.availability__day--available:active,
.availability__day--range,
.availability__day--selected {
  box-shadow: none;
  transform: none;
}
.availability__arrow {
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--control-bg);
  box-shadow: none;
}
.availability__arrow:active:not(:disabled) {
  transform: none;
  box-shadow: none;
  background: var(--selected-bg);
}
.time-sheet__date {
  margin: 0 0 8px;
  font-size: clamp(20px, 3vw, 24px);
  font-weight: 600;
  line-height: 1.4;
  color: var(--ink);
}
.time-sheet__summary {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--muted);
}
.time-sheet__selection {
  margin: 22px 0;
  font-size: 14px;
  line-height: 1.65;
  color: var(--muted);
}
.time-sheet {
  width: min(520px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
}
.time-sheet.media-dialog :deep(.media-dialog__content) {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  text-align: center;
}
@media (max-width: 575.98px) {
  .time-sheet.media-dialog :deep(.media-dialog__content) {
    padding: 22px 16px;
  }
  .availability__slot {
    flex-basis: calc((100% - 8px) / 2);
  }
}
@media (max-width: 575.98px) {
  .availability__calendar {
    padding: 8px;
    border: 0;
    background: transparent;
  }
  .availability__period {
    margin-top: 18px;
    padding-top: 18px;
  }
  .availability__period-dates > div {
    padding: 10px;
  }
  .availability__period-dates strong {
    font-size: 16px;
  }
  .availability :deep(.calendar-stage) {
    padding: 14px 2px;
    margin-top: 18px;
  }
}
@media (max-width: 575.98px) {
  .availability__settings {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .availability__settings :deep(.number-stepper) {
    padding: 8px 2px;
  }
  .availability__settings :deep(.number-stepper__heading) {
    padding-inline: 6px;
  }
  .availability__settings :deep(.number-stepper__range) {
    display: none;
  }
  .availability__settings :deep(.number-stepper__controls) {
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    gap: 0;
  }
  .availability__settings :deep(.number-stepper__button) {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }
  .availability__settings :deep(.number-stepper__input) {
    font-size: 22px;
  }
}

.availability__settings {
  gap: 16px;
}
.availability__settings :deep(.number-stepper) {
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}
.availability__settings :deep(.number-stepper__heading) {
  padding: 0 4px;
  margin: 0 0 10px;
}
.availability__settings :deep(.number-stepper__label) {
  font-size: 15px;
  font-weight: 500;
  color: var(--muted);
}
.availability__settings :deep(.number-stepper__range) {
  display: none;
}
.availability__settings :deep(.number-stepper__controls) {
  width: 100%;
  padding: 5px;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 0;
  border: 1px solid #c9b39c3b;
  border-radius: 100px;
  background: linear-gradient(120deg, #3f3832, #34271e);
  box-shadow: inset 0 1px 0 #ffffff09;
}
.availability__settings :deep(.number-stepper__button) {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: #ffffff09;
  color: #f6f4f3;
  font-size: 26px;
}
.availability__settings :deep(.number-stepper__button--increase) {
  background: #c7b09826;
  color: #f6f4f3;
}
.availability__settings :deep(.number-stepper__button:disabled) {
  opacity: 0.35;
}
.availability__settings :deep(.number-stepper__input) {
  font-size: 24px;
  font-weight: 500;
  color: var(--ink);
  min-height: 44px;
}
.availability__settings :deep(.number-stepper__input:focus) {
  outline: none;
  box-shadow: none;
}
.availability__settings :deep(.number-stepper__controls:has(.number-stepper__input:focus-visible)) {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}
.availability__settings :deep(.number-stepper__suffix) {
  display: none;
}
.availability__settings .availability__guests--single {
  display: block;
  max-width: 320px;
  width: 100%;
}
@media (max-width: 575.98px) {
  .availability__settings {
    gap: 10px;
  }
  .availability__settings :deep(.number-stepper__controls) {
    padding: 3px;
  }
  .availability__settings :deep(.number-stepper__input) {
    font-size: 22px;
  }
}
@media (hover: hover) {
  .availability__settings :deep(.number-stepper__button:hover:not(:disabled)) {
    background: #c7b09845;
  }
}

.availability__calendar {
  padding: 0;
}
.availability__period-dates strong {
  min-height: 1.65em;
}
@media (max-width: 991.98px) {
  .availability__dialog-heading {
    margin-bottom: 12px;
  }
  .availability__settings .availability__guests--single {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: none;
  }
  .availability__guests--single :deep(.number-stepper__heading) {
    margin: 0;
    padding: 0;
  }
  .availability__guests--single :deep(.number-stepper__controls) {
    flex: 1;
    min-width: 0;
    max-width: 260px;
  }
  .availability__period {
    margin-top: 12px;
    padding-top: 12px;
  }
  .availability__period-dates > div {
    padding: 8px 10px;
  }
  .availability__period-dates span:not(.availability__period-arrow) {
    margin-bottom: 0;
    font-size: 12px;
  }
  .availability__period-footer {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    margin-top: 8px;
  }
  .availability__range-help {
    font-size: 12px;
    text-align: left;
  }
  .availability__reset {
    padding: 8px 12px;
    font-size: 14px;
  }
  .availability .availability__month-stage {
    margin: 12px 0 0;
    padding: 12px 2px;
  }
  .availability__month-stage :deep(.calendar-stage__header) {
    padding-bottom: 8px;
  }
  .availability__month {
    font-size: 25px;
  }
  .availability__grid {
    row-gap: 3px;
  }
  .availability__day {
    min-height: 44px;
  }
  .availability__weekday {
    padding-bottom: 4px;
    font-size: 14px;
  }
  .availability__estimate-dock {
    height: 78px;
    margin-top: 12px;
  }
}
@media (min-width: 992px) {
  .availability {
    --calendar-day-size: clamp(44px, calc((100dvh - 570px) / 6), 54px);
    --availability-times-height: clamp(
      34px,
      calc(100dvh - 396px - 6 * var(--calendar-day-size)),
      154px
    );
  }
  .availability__layout {
    max-width: none;
  }
  .availability__calendar {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    align-items: start;
    gap: 24px;
  }
  .availability__settings {
    grid-template-columns: minmax(0, 1fr);
  }
  .availability__period {
    margin-top: 16px;
    padding-top: 16px;
  }
  .availability__period-dates {
    gap: 8px;
  }
  .availability__period-dates > div {
    padding: 10px;
  }
  .availability__month-stage {
    width: 100%;
    margin: 0;
    padding: 12px 8px;
  }
  .availability__month-stage :deep(.calendar-stage__header) {
    padding-bottom: 8px;
  }
  .availability__month {
    font-size: 28px;
  }
  .availability__grid {
    width: 100%;
    row-gap: 4px;
  }
  .availability__weekday {
    padding-bottom: 4px;
    font-size: 14px;
    line-height: 20px;
  }
  .availability__day {
    justify-self: center;
    width: calc(100% - 6px);
    min-height: var(--calendar-day-size);
    line-height: 1.2;
  }
  .availability__day--range {
    justify-self: stretch;
    width: auto;
  }
}
@media (min-width: 992px) and (max-height: 760px) {
  .availability {
    --availability-times-height: clamp(34px, calc(100dvh - 604px), 154px);
  }
  .availability__dialog-heading {
    margin-bottom: 8px;
  }
  .availability__month-stage {
    padding-block: 4px;
  }
  .availability__month {
    font-size: 25px;
  }
  .availability__grid {
    row-gap: 3px;
  }
  .availability__weekday {
    font-size: 14px;
    padding-bottom: 0;
  }
}
@media (min-width: 992px) and (max-height: 680px) {
  .availability__period {
    margin-top: 10px;
    padding-top: 10px;
  }
  .availability__period-dates > div {
    padding: 8px;
  }
  .availability__period-footer {
    margin-top: 8px;
    gap: 6px;
  }
  .availability__range-help {
    font-size: 12px;
  }
  .availability__settings .availability__guests--single {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .availability__guests--single :deep(.number-stepper__heading) {
    margin: 0;
    padding: 0;
  }
  .availability__guests--single :deep(.number-stepper__controls) {
    flex: 1;
    min-width: 0;
  }
}
@media (min-width: 768px) and (max-width: 991.98px) {
  .availability .availability__month-stage {
    max-width: 374px;
    margin-inline: auto;
  }
}
</style>
