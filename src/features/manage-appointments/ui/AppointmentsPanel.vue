<template>
  <div class="appointments-panel__content">
    <div class="mb-4 d-flex align-items-center justify-content-between gap-4">
      <h2 class="fs-4 fw-semibold mb-0">
        {{ date ? shortDate(date) : isAdmin ? 'Брони клиентов' : 'Мои брони' }}
      </h2>
      <span class="text-end small text-body-secondary">{{
        date ? 'По времени начала' : `Активных броней: ${activeCount}`
      }}</span>
    </div>
    <div v-if="isAdmin && !date" class="mb-4 d-flex flex-wrap align-items-end gap-3 small">
      <div class="flex-grow-1 appointments-panel__filter">
        <label for="filter-date" class="form-label mt-4 mb-2 d-block small fw-semibold mt-0"
          >Дата аренды</label
        ><input id="filter-date" v-model="adminDate" class="form-control" type="date" />
      </div>
      <div class="flex-grow-1 appointments-panel__filter">
        <label for="filter-status" class="form-label mt-4 mb-2 d-block small fw-semibold mt-0"
          >Статус</label
        ><select id="filter-status" v-model="adminStatus" class="form-select">
          <option value="confirmed">Подтверждённые</option>
          <option value="completed">Состоявшиеся</option>
          <option value="cancelled">Отменённые</option>
          <option value="all">Все брони</option>
        </select>
      </div>
      <BaseButton v-if="adminDate" variant="text" @click="adminDate = ''">Все даты</BaseButton>
    </div>
    <div v-if="!items.length" class="mt-4 border px-4 py-5 text-center appointments-panel__empty">
      <h2 class="fs-4 fw-semibold">
        {{
          date
            ? closed
              ? 'День для отдыха'
              : 'На этот день броней нет'
            : isAdmin
              ? 'Броней пока нет'
              : 'У вас пока нет броней'
        }}
      </h2>
      <p class="my-3 small text-body-secondary">
        {{
          date
            ? closed
              ? 'Аренда закрыта в расписании. Новые брони на этот день недоступны.'
              : 'Выберите клиента и удобное время — бронь появится здесь.'
            : isAdmin
              ? 'Здесь появятся брони клиентов, подходящие под выбранные фильтры.'
              : 'Выберите вариант аренды и удобное время. Новая бронь появится здесь.'
        }}
      </p>
      <BaseButton v-if="!isAdmin || (date && canBook)" @click="emit('book')">{{
        isAdmin ? 'Добавить бронь' : 'Выбрать время'
      }}</BaseButton>
    </div>
    <p v-if="error" role="alert" class="alert alert-warning mt-3 small">{{ error }}</p>
    <AppointmentCard
      v-for="booking in items"
      :key="booking.id"
      :booking="booking"
      :is-admin="isAdmin"
      :confirming="cancellation === booking.id"
      :visit-number="numberForVisit(booking)"
      :can-complete="canComplete(booking, clock)"
      @complete="complete(booking.id)"
      @undo="undoCompletion(booking.id)"
      @request-cancel="cancellation = booking.id"
      @cancel="cancel(booking.id)"
      @keep="cancellation = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePractice, canComplete, bookingDates } from '../../../entities/practice/index.ts';
import AppointmentCard from './AppointmentCard.vue';
import { BaseButton } from '../../../shared/ui/index.ts';
import { shortDate } from '../../../shared/lib/format/index.ts';

const emit = defineEmits<{ book: [] }>();
const props = defineProps<{ date?: string; closed?: boolean; canBook?: boolean }>();

const {
  isAdmin,
  activeCount,
  visibleBookings,
  adminDate,
  adminStatus,
  cancelBooking,
  completeBooking,
  undoCompletion,
  numberForVisit,
  clock,
  bookings,
} = usePractice();
const items = computed(() =>
  props.date
    ? bookings.value
        .filter((item) => bookingDates(item).includes(props.date!))
        .toSorted((a, b) => a.time.localeCompare(b.time))
    : visibleBookings.value,
);
const cancellation = ref<string | null>(null);
const error = ref('');
function complete(id: string) {
  error.value = '';
  try {
    completeBooking(id);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось отметить аренду.';
  }
}
function cancel(id: string) {
  cancelBooking(id);
  cancellation.value = null;
}
</script>

<style scoped>
.appointments-panel__content {
  min-width: 0;
}
.appointments-panel__filter {
  min-width: 10rem;
}
.appointments-panel__empty {
  border-radius: 20px;
  background: linear-gradient(145deg, #fffdf7, #eff2e5);
}
</style>
