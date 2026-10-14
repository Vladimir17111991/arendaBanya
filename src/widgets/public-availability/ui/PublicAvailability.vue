<template>
  <section class="availability" tabindex="-1" aria-labelledby="availability-title">
    <div class="container">
      <h2 id="availability-title" class="visually-hidden">Свободные даты и расчёт стоимости</h2>
      <div v-if="services.length" class="availability__layout">
        <div class="availability__calendar">
          <div class="availability__settings">
            <NumberStepper
              v-if="!daily"
              id="public-quantity"
              v-model="quantity"
              label="Часы"
              :min="1"
              :max="maxQuantity"
              suffix="ч."
            />
            <NumberStepper
              id="public-guests"
              v-model="guestCount"
              :class="{ 'availability__guests--single': daily }"
              label="Гости"
              :min="1"
              :max="MAX_GUESTS"
              suffix="чел."
            />
          </div>
          <div v-if="daily" class="availability__period">
            <div class="availability__period-dates">
              <div :class="{ 'availability__period-date--active': !selectedDate }">
                <span>Заезд</span>
                <strong>{{ rangeStart ? shortDate(rangeStart) : 'Выберите дату' }}</strong>
              </div>
              <span class="availability__period-arrow" aria-hidden="true">→</span>
              <div :class="{ 'availability__period-date--active': choosingEnd }">
                <span>Выезд</span>
                <strong>{{ rangeEnd ? shortDate(rangeEnd) : 'Выберите дату' }}</strong>
              </div>
            </div>
            <div class="availability__period-footer">
              <p id="public-range-help" class="availability__range-help" aria-live="polite">
                {{ rangeHint }}
              </p>
              <button
                v-if="selectedDate"
                type="button"
                class="availability__reset"
                @click="clearSelection"
              >
                Сбросить даты
              </button>
            </div>
          </div>
          <CalendarStage :month="month" :direction="monthDirection">
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
                  v-if="day.selectable && day.inMonth && !day.inRange && !day.isStart && !day.isEnd"
                  class="availability__dot"
                  aria-hidden="true"
                ></span>
              </button>
            </div>
          </CalendarStage>
          <div v-if="!daily" class="availability__legend">
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
        <div class="availability__details" aria-live="polite">
          <span class="availability__tag">{{ daily ? 'Баня и спальня' : 'Почасовая аренда' }}</span>
          <div class="availability__price">
            <p class="availability__price-label">
              {{ previewValid ? 'Стоимость этого периода' : 'Ваш расчёт' }}
            </p>
            <strong class="availability__total">{{
              displayedPrice === null ? 'Укажите гостей и срок' : money(displayedPrice)
            }}</strong>
            <p
              v-if="displayedPrice !== null && service && service.price > 0"
              class="availability__formula"
            >
              {{ money(service.price) }} × {{ guestCount }} чел. × {{ displayedQuantity }}
              {{ daily ? 'сут.' : 'ч.' }}
            </p>
            <p class="availability__price-note">
              Тестовый тариф за каждого гостя. Условия и количество мест уточните у Виктории.
            </p>
          </div>
          <template v-if="daily">
            <h3 class="availability__date">{{ checkoutDate ? 'Ваш отдых' : 'Когда приедете?' }}</h3>
            <dl v-if="checkoutDate" class="availability__stay">
              <div>
                <dt>Заезд</dt>
                <dd>{{ fullDate(selectedDate) }}</dd>
              </div>
              <div>
                <dt>Выезд</dt>
                <dd>{{ fullDate(checkoutDate) }}</dd>
              </div>
              <div>
                <dt>Продолжительность</dt>
                <dd>{{ quantity }} {{ dayWord(quantity) }}</dd>
              </div>
            </dl>
            <p v-else class="availability__hint">
              {{
                choosingEnd
                  ? 'Теперь выберите дату выезда. Весь период будет выделен в календаре.'
                  : 'Выберите дату заезда, затем дату выезда. Количество суток и стоимость рассчитаются автоматически.'
              }}
            </p>
            <p class="availability__hint">
              Время заезда и выезда согласуйте с Викторией по телефону.
            </p>
          </template>
          <h3 v-else class="availability__date">
            {{ selectedDate ? fullDate(selectedDate) : 'Когда приедете?' }}
          </h3>
          <template v-if="!daily && selectedDate && slots.length">
            <button type="button" class="availability__reset" @click="timeSheet = true">
              Посмотреть свободное время
            </button>
            <p class="availability__hint">Время начала согласуйте с Викторией при звонке.</p>
          </template>
          <p v-else-if="!daily" class="availability__hint">
            Выберите отмеченную дату в календаре. Здесь появится доступное время с учётом
            длительности аренды.
          </p>
          <div v-if="completeSelection" class="availability__phone-summary">
            <p id="public-phone-summary-label" class="availability__summary-label">
              Ваш выбор для звонка
            </p>
            <p
              id="public-phone-summary"
              class="availability__summary-text"
              tabindex="0"
              aria-labelledby="public-phone-summary-label"
            >
              {{ requestDetails }}
            </p>
            <button type="button" @click="copySelection">
              Скопировать детали <span aria-hidden="true">↗</span>
            </button>
            <p v-if="copyFeedback" role="status">{{ copyFeedback }}</p>
          </div>
          <ContactLink
            class="btn btn-primary section-button availability__call"
            :service-name="requestDetails"
            >Позвонить Виктории <ActionArrow
          /></ContactLink>
          <p class="availability__confirmation">Бронь подтверждается Викторией по телефону.</p>
        </div>
      </div>
      <p v-else class="availability__intro">
        Расписание появится после добавления вариантов аренды. Уточните доступные даты у Виктории.
      </p>
      <p class="availability__demo">
        {{
          daily
            ? 'Посуточная аренда — со спальней. Выезд в выбранную дату; точное время согласуйте по телефону.'
            : 'Тестовое расписание: 10:00–19:00 · время местное, Беларусь (UTC+3).'
        }}
      </p>
    </div>
    <MediaDialog
      :open="timeSheet"
      class="time-sheet"
      title="Доступное время"
      @close="timeSheet = false"
    >
      <p class="time-sheet__date">{{ selectedDate ? fullDate(selectedDate) : '' }}</p>
      <p>{{ quantity }} ч. · {{ guestCount }} гостей · {{ money(totalPrice ?? 0) }}</p>
      <div class="availability__slots">
        <span v-for="time in slots" :key="time" class="availability__slot"
          >{{ time }}–{{ slotEnd(time) }}</span
        >
      </div>
      <p v-if="!slots.length" role="status">
        Свободного времени на эту дату нет. Выберите другую дату.
      </p>
      <p class="time-sheet__selection" aria-live="polite">
        Свободные варианты для выбранной длительности. Точное время согласуйте по телефону.
      </p>
      <button type="button" class="btn btn-primary w-100" @click="timeSheet = false">Готово</button>
    </MediaDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { MAX_GUESTS, rentalPrice, usePractice } from '../../../entities/practice/index.ts';
import { ContactLink } from '../../../features/contact-specialist/index.ts';
import { ActionArrow, NumberStepper, MediaDialog } from '../../../shared/ui/index.ts';
import { fullDate, shortDate, money } from '../../../shared/lib/format/index.ts';
import { usePublicAvailability } from '../model/usePublicAvailability.ts';
import CalendarStage from './CalendarStage.vue';
import { createDateDrag } from '../model/dateDrag.ts';

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
  if (!daily.value && selectedDate.value === date) timeSheet.value = true;
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

const copyFeedback = ref('');
const emit = defineEmits<{ selectionDetails: [details: string] }>();
watch(requestDetails, (details) => emit('selectionDetails', details), { immediate: true });
const completeSelection = computed(
  () =>
    validGuests.value &&
    validQuantity.value &&
    (daily.value ? !!checkoutDate.value : !!selectedDate.value),
);
watch(requestDetails, () => {
  copyFeedback.value = '';
});
async function copySelection() {
  try {
    await navigator.clipboard.writeText(requestDetails.value);
    copyFeedback.value = 'Детали скопированы.';
  } catch {
    copyFeedback.value = 'Выделите текст выше и скопируйте вручную.';
  }
}

function dayWord(value: number) {
  return value % 10 === 1 && value % 100 !== 11 ? 'сутки' : 'суток';
}
const rangeHint = computed(() => {
  if (previewValid.value)
    return `${previewQuantity.value} ${dayWord(previewQuantity.value)} · нажмите на дату, чтобы выбрать период`;
  if (choosingEnd.value) return 'Выберите выезд или проведите пальцем по датам.';
  if (checkoutDate.value)
    return `${quantity.value} ${dayWord(quantity.value)} · новый клик начнёт выбор заново`;
  return 'Проведите от заезда до выезда или нажмите две даты.';
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
  color: var(--ink, #fcf5ff);
  font-size: 16px;
  line-height: 1.65;
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
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
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
  border-top: 1px solid var(--line, #5b3b71);
}
.availability__steps li > span {
  color: var(--accent, #ff95d4);
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
  background: var(--surface, #21132f);
  border: 1px solid var(--line, #5b3b71);
  border-radius: 24px;
  padding: 28px;
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
  border: 1px solid var(--line, #5b3b71);
  border-radius: 16px;
  background: var(--surface-soft, #2b1a3b);
  cursor: pointer;
  color: var(--brand);
}
.availability__format--selected {
  background: var(--control-bg, #321c45);
  border-color: var(--accent, #ff95d4);
  box-shadow: inset 0 0 0 1px var(--accent, #ff95d4);
}
.availability__format:has(input:focus-visible) {
  outline: 3px solid var(--focus, #ff9ede);
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
  background: var(--selected-bg, #7b35b7);
  border-color: var(--accent, #ff95d4);
}
.availability__period {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid var(--line, #5b3b71);
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
  background: var(--surface-soft, #2b1a3b);
  border: 1px solid var(--line, #5b3b71);
  border-radius: 14px;
}
.availability__period-dates > .availability__period-date--active {
  border-color: var(--accent, #ff95d4);
  background: var(--control-bg, #321c45);
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
  color: var(--accent, #ff95d4);
  font-size: 20px;
}
.availability__period-footer {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: start;
  justify-content: space-between;
}
.availability__range-help {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  min-height: 38px;
}
.availability__reset {
  flex-shrink: 0;
  min-height: 44px;
  padding: 9px 16px;
  border: 1px solid var(--accent, #ff95d4);
  border-radius: 12px;
  background: var(--control-bg, #321c45);
  color: var(--brand);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}
.availability__range-error {
  margin: 14px 0 0;
  color: var(--accent, #ff95d4);
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
  text-shadow: 0 2px 18px #eaa4ff25;
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
  background: linear-gradient(145deg, #58356d, #321c45);
  border: 1px solid var(--line, #5b3b71);
  color: var(--brand);
  font-size: 22px;
  box-shadow:
    inset 0 1px 0 #f6d9ff30,
    0 4px 0 #170d22,
    0 8px 14px #09040f50;
  transition:
    transform 180ms,
    box-shadow 180ms;
}
.availability__arrow:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow:
    inset 0 1px 0 #f6d9ff30,
    0 1px 0 #170d22;
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
  color: var(--muted, #cdbedb);
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
  color: var(--ink, #fcf5ff);
  background: linear-gradient(145deg, #513165, #34203f);
  border-color: #b084ca45;
  transform: none;
  box-shadow:
    inset 0 1px 0 #f5d5ff25,
    0 4px 0 #160c21,
    0 7px 10px #08031055;
}
.availability__day--available:hover {
  border-color: var(--accent, #ff95d4);
  background: linear-gradient(145deg, #724184, #482653);
  box-shadow:
    inset 0 1px 0 #ffe6ff70,
    0 4px 0 #160c21,
    0 0 18px #eb55bf35;
}
.availability__day--available:active {
  transform: none;
  box-shadow:
    inset 0 1px 0 #ffe6ff70,
    0 1px 0 #160c21;
}
.availability__day--range {
  margin-inline: 0;
  border-radius: 0;
  color: var(--ink, #fcf5ff);
  background: linear-gradient(180deg, #66338a, #4e245f);
  border-inline-color: transparent;
  border-block-color: #c177d177;
  transform: none;
  box-shadow:
    inset 0 1px 0 #f3b0ed30,
    0 4px 0 #291237;
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
  background: var(--control-bg, #321c45);
  box-shadow: inset 0 -3px var(--accent, #ff95d4);
}
.availability__day--selected {
  color: var(--selected-text, #fff);
  background: linear-gradient(145deg, #a557d6, #8d327f);
  border-color: #ffb1e4;
  transform: none;
  box-shadow:
    inset 0 1px 0 #ffe0fbb0,
    0 5px 0 #451c53,
    0 0 22px #ed76d957;
  font-weight: 700;
}
.availability__day--selected:hover {
  background: linear-gradient(145deg, #b66ce2, #9a408d);
}
.availability__day--range:hover {
  background: linear-gradient(180deg, #8142a5, #633075);
}
.availability__day:focus-visible,
.availability__reset:focus-visible,
.availability__arrow:focus-visible,
.availability__slot:focus-visible,
.availability__phone-summary button:focus-visible,
.availability__summary-text:focus-visible {
  outline: 3px solid var(--focus, #ff9ede);
  outline-offset: 2px;
  z-index: 2;
}
.availability__day:disabled {
  cursor: not-allowed;
  color: #ac99b7;
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
  background: var(--accent, #ff95d4);
  border-radius: 50%;
  flex-shrink: 0;
}
.availability__details {
  min-width: 0;
  width: 100%;
  border: 1px solid var(--line, #5b3b71);
  background: var(--surface, #21132f);
  padding: 32px;
  border-radius: 24px;
  display: flex;
  align-items: start;
  flex-direction: column;
  align-self: start;
  position: sticky;
  top: 120px;
}
.availability__tag {
  border: 1px solid var(--line, #5b3b71);
  padding: 7px 12px;
  font-size: 14px;
  border-radius: 100px;
  margin-bottom: 18px;
}
.availability__price {
  width: 100%;
  margin-bottom: 26px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line, #5b3b71);
}
.availability__price-label {
  font-size: 16px;
  color: var(--muted);
  margin: 0 0 8px;
}
.availability__total {
  display: block;
  font: 400 clamp(30px, 3vw, 40px)/1.2 var(--display);
  color: var(--brand);
  overflow-wrap: anywhere;
}
.availability__formula {
  margin: 10px 0 0;
  font-size: 16px;
}
.availability__price-note {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}
.availability__date {
  font: 400 30px/1.25 var(--display);
  margin-bottom: 16px;
}
.availability__detail-label {
  font-size: 16px;
  color: var(--muted);
}
.availability__slots {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 22px;
}
.availability__slot {
  min-height: 48px;
  min-width: 72px;
  border: 1px solid var(--line, #5b3b71);
  border-radius: 10px;
  background: var(--control-bg, #321c45);
  padding: 10px 14px;
  font-size: 16px;
  color: var(--brand);
}
.availability__slot--selected {
  background: var(--selected-bg, #7b35b7);
  border-color: var(--accent, #ff95d4);
  color: var(--selected-text, #fff);
}
.availability__selection {
  line-height: 1.8;
  font-size: 16px;
}
.availability__stay {
  width: 100%;
  margin: 0 0 20px;
}
.availability__stay > div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line, #5b3b71);
  font-size: 16px;
}
.availability__stay dt {
  font-weight: 400;
  color: var(--muted);
}
.availability__stay dd {
  min-width: 0;
  margin: 0;
  color: var(--brand);
  text-align: right;
  overflow-wrap: anywhere;
}
.availability__hint {
  color: var(--muted);
  line-height: 1.8;
  font-size: 16px;
}
.availability__call {
  margin-top: auto;
  width: 100%;
  min-height: 52px;
  font-size: 16px;
}
.availability__phone-summary {
  width: 100%;
  padding-top: 16px;
  border-top: 1px solid var(--line, #5b3b71);
  margin: 4px 0 22px;
}
.availability__summary-label {
  display: block;
  color: var(--muted);
  font-size: 16px;
  margin: 0 0 10px;
}
.availability__summary-text {
  display: block;
  width: 100%;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--line, #5b3b71);
  border-radius: 14px;
  background: var(--surface-soft, #2b1a3b);
  font-size: 16px;
  line-height: 1.7;
  color: var(--brand);
  user-select: text;
  -webkit-user-select: text;
  -webkit-touch-callout: default;
  cursor: text;
  overflow-wrap: anywhere;
}
.availability__phone-summary button {
  min-height: 44px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  border: 1px solid var(--line, #5b3b71);
  border-radius: 12px;
  background: var(--control-bg, #321c45);
  color: var(--brand);
  font-size: 16px;
  line-height: 1.5;
}
.availability__phone-summary p[role='status'] {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--brand);
}
.availability__confirmation {
  font-size: 14px;
  line-height: 1.6;
  margin: 16px 0 0;
  color: var(--muted);
}
.availability__demo {
  font-size: 14px;
  color: var(--muted);
  margin: 20px 0 0;
  line-height: 1.7;
}
.availability__reset:hover,
.availability__arrow:hover:not(:disabled),
.availability__slot:hover,
.availability__phone-summary button:hover {
  border-color: var(--accent, #ff95d4);
  background: var(--selected-bg, #7b35b7);
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
  .availability__calendar,
  .availability__details {
    padding: 20px;
  }
  .availability__settings {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .availability__details {
    position: static;
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
  .availability__details {
    min-height: 320px;
    position: static;
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
  .availability__period-footer {
    flex-wrap: wrap;
  }
  .availability__reset {
    width: 100%;
  }
}
@media (max-width: 399.98px) {
  .availability__settings {
    grid-template-columns: 1fr;
  }
  .availability__calendar,
  .availability__details {
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
  font-size: 22px;
  color: var(--ink);
}
.time-sheet__selection {
  margin: 24px 0;
}
.time-sheet {
  max-width: 520px;
}
@media (max-width: 767.98px) {
  .time-sheet {
    margin: auto 0 0;
    width: 100%;
    max-width: none;
    max-height: 85dvh;
    border-radius: 24px 24px 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .time-sheet[open] {
    animation: sheet-in 260ms ease-out;
  }
}
@keyframes sheet-in {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .time-sheet[open] {
    animation: none;
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
</style>
