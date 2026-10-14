<template>
  <div class="cabinet-dashboard">
    <div class="cabinet-dashboard__summary mb-3 mb-lg-4">
      <div>
        <span class="small text-muted">Брони</span><strong>{{ planned }}</strong>
      </div>
      <div>
        <span class="small text-muted">Завершено</span><strong>{{ completed }}</strong>
      </div>
      <div>
        <span class="small text-muted">Доступность</span
        ><strong class="cabinet-dashboard__hours">{{ closed ? 'Закрыто' : 'Открыто' }}</strong>
      </div>
    </div>

    <div class="cabinet-dashboard__calendar">
      <AppointmentCalendar v-model="date" />
      <button type="button" class="btn btn-link w-100 mt-1" @click="emit('schedule')">
        Закрытые даты и перерывы ↗
      </button>
    </div>
    <section class="cabinet-dashboard__agenda">
      <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
        <p class="small text-muted mb-0">
          {{ date === today ? 'Сегодня' : dayName(date) }} · время UTC+3
        </p>
        <button
          v-if="canBook"
          type="button"
          class="btn btn-outline-primary cabinet-dashboard__add"
          @click="emit('book', { date })"
        >
          ＋ Бронь
        </button>
      </div>
      <AppointmentsPanel
        :date="date"
        :closed="closed"
        :can-book="canBook"
        @book="emit('book', { date })"
      />
      <button
        v-if="next && next.date !== date"
        type="button"
        class="cabinet-dashboard__next mt-4"
        @click="date = next.date"
      >
        <span class="small text-muted">Ближайшая бронь <span aria-hidden="true">↗</span></span>
        <strong class="d-block mt-1"
          >{{ shortDate(next.date) }} · {{ next.time }} — {{ next.name }}</strong
        >
        <span class="small">{{ next.service.name }}</span>
        <span class="small d-block"
          >Гостей: {{ next.guestCount ?? 1 }} · Итого: {{ money(next.service.price) }}</span
        >
      </button>
    </section>
    <div class="cabinet-dashboard__clients">
      <ClientsPanel
        compact
        @book="(clientId) => emit('book', { clientId, date: canBook ? date : undefined })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  usePractice,
  isClosed,
  addDays,
  freeSlots,
  bookingDates,
  bookingEnd,
} from '../../../entities/practice/index.ts';
import {
  AppointmentCalendar,
  AppointmentsPanel,
} from '../../../features/manage-appointments/index.ts';
import { ClientsPanel } from '../../../features/manage-clients/index.ts';
import { dayName, shortDate, money } from '../../../shared/lib/format/index.ts';
import type { BookingPrefill } from '../../../shared/routing/index.ts';
const emit = defineEmits<{ book: [prefill: BookingPrefill]; schedule: [] }>();
const { adminDate, today, bookings, daysOff, breaks, clock, services } = usePractice();
const date = computed({
  get: () => adminDate.value || today.value,
  set: (value: string) => {
    adminDate.value = value;
  },
});
const daily = computed(() =>
  bookings.value.filter((item) => bookingDates(item).includes(date.value)),
);
const planned = computed(() => daily.value.filter((item) => item.status === 'confirmed').length);
const completed = computed(() => daily.value.filter((item) => item.status === 'completed').length);
const closed = computed(() => isClosed(date.value, daysOff.value, breaks.value));
const canBook = computed(
  () =>
    !closed.value &&
    date.value >= today.value &&
    date.value < addDays(today.value, 90) &&
    services.value.some(
      (service) =>
        freeSlots({
          date: date.value,
          duration: service.duration,
          rentalUnit: service.rentalUnit,
          bookings: bookings.value,
          daysOff: daysOff.value,
          breaks: breaks.value,
          now: clock.value,
        }).length > 0,
    ),
);
const next = computed(
  () =>
    bookings.value
      .filter(
        (item) =>
          item.status === 'confirmed' &&
          new Date(bookingEnd(item).date + 'T' + bookingEnd(item).time + ':00+03:00') > clock.value,
      )
      .toSorted((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0],
);
</script>

<style scoped>
.cabinet-dashboard {
  display: grid;
  gap: 24px;
  grid-template-areas: 'summary' 'calendar' 'agenda' 'clients';
}
.cabinet-dashboard__calendar {
  grid-area: calendar;
  min-width: 0;
}
.cabinet-dashboard__agenda {
  grid-area: agenda;
  min-width: 0;
}
.cabinet-dashboard__clients {
  grid-area: clients;
  min-width: 0;
}
.cabinet-dashboard__summary {
  grid-area: summary;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(120deg, #e5ebd9, #f4ead7);
  border: 1px solid #d7decb;
}
.cabinet-dashboard__summary strong {
  display: block;
  font-size: 30px;
  font-weight: 600;
  margin-top: 6px;
  line-height: 1.2;
  color: var(--brand);
}
.cabinet-dashboard__summary .cabinet-dashboard__hours {
  font-size: 23px;
}
.cabinet-dashboard__next {
  width: 100%;
  padding: 20px;
  text-align: left;
  border: 1px solid #d9dece;
  border-radius: 16px;
  background: #f5f7ef;
  color: var(--ink);
  transition: background 200ms;
}
.cabinet-dashboard__next:hover {
  background: #e9eddc;
}
.cabinet-dashboard__add {
  padding: 8px 16px;
  font-size: 13px;
}
@media (min-width: 992px) {
  .cabinet-dashboard {
    grid-template-columns: minmax(320px, 0.8fr) minmax(0, 1.65fr);
    grid-template-rows: auto 1fr;
    grid-template-areas: 'summary summary' 'calendar agenda' 'clients agenda';
    gap: 24px 32px;
    align-items: start;
  }
}
@media (max-width: 575.98px) {
  .cabinet-dashboard {
    gap: 16px;
  }
  .cabinet-dashboard__summary {
    padding: 12px;
    gap: 8px;
  }
  .cabinet-dashboard__summary .small {
    font-size: 12px;
  }
  .cabinet-dashboard__summary strong {
    font-size: 26px;
  }
  .cabinet-dashboard__summary .cabinet-dashboard__hours {
    font-size: 18px;
    padding-top: 5px;
  }
}
</style>
