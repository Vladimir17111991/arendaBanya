<template>
  <div class="card p-4 align-self-start p-md-5" role="status">
    <span
      class="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success-emphasis flex-shrink-0 booking-confirmation__success-icon"
      aria-hidden="true"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m5 12 4.5 4.5L19 7" />
      </svg>
    </span>
    <h2 class="display-subtitle mb-4">Бронь добавлена</h2>
    <p v-if="isAdmin">{{ booking.name }} · {{ booking.phone }}</p>
    <p v-else>{{ booking.name }}, бронь появилась в расписании.</p>
    <div class="my-4 d-flex flex-column gap-3 rounded-2 bg-light p-4">
      <strong>{{ booking.service.name }}</strong>
      <p>Начало: {{ fullDate(booking.date) }} · {{ booking.time }}</p>
      <p>Окончание: {{ fullDate(end.date) }} · {{ end.time }}</p>
      <p>
        Гостей: {{ booking.guestCount ?? 1 }} ·
        {{ booking.service.rentalUnit === 'day' ? 'Суток' : 'Часов' }}: {{ quantity }}
      </p>
      <p v-if="booking.unitPrice" class="small text-body-secondary">
        {{ money(booking.unitPrice) }} × {{ booking.guestCount ?? 1 }} чел. × {{ quantity }}
        {{ booking.service.rentalUnit === 'day' ? 'сут.' : 'ч' }}
      </p>
      <strong>Итого: {{ money(booking.service.price) }}</strong>
    </div>
    <p v-if="isAdmin" class="mb-3 small text-body-secondary">
      Время занято в расписании и больше не показывается свободным. Бронь привязана к карточке
      клиента.
    </p>
    <p class="mb-3 small text-body-secondary">
      Демо: данные сохраняются до обновления вкладки, сообщения не отправляются.
    </p>
    <BaseButton @click="$emit('show')">{{
      isAdmin ? 'Посмотреть в расписании' : 'Перейти в мой кабинет'
    }}</BaseButton>
    <BaseButton v-if="isAdmin" variant="text" class="mt-3 d-block" @click="$emit('another')"
      >Добавить ещё бронь</BaseButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { bookingEnd, type Booking } from '../../../entities/practice/index.ts';
import { fullDate, money } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';

const props = defineProps<{ booking: Booking; isAdmin: boolean }>();
const end = computed(() => bookingEnd(props.booking));
const quantity = computed(
  () =>
    props.booking.quantity ??
    props.booking.service.duration / (props.booking.service.rentalUnit === 'day' ? 1440 : 60),
);
defineEmits<{ show: []; another: [] }>();
</script>

<style scoped>
.booking-confirmation__success-icon {
  width: 3.25rem;
  height: 3.25rem;
}
</style>
