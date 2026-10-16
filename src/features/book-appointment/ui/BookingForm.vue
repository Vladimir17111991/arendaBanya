<template>
  <section v-if="!isAdmin" class="card p-4 mt-5">
    <h1 class="display-subtitle">Бронирование по телефону</h1>
    <p class="my-3 text-body-secondary">
      Позвоните, чтобы согласовать часы или дни отдыха. После подтверждения бронь появится в
      расписании.
    </p>
    <BaseButton @click="emit('back')">На сайт</BaseButton>
  </section>
  <section v-else-if="!service" class="card p-4 mt-5">
    <h1 class="display-subtitle">Пока нет вариантов аренды</h1>
    <p class="my-3 text-body-secondary">Добавьте вариант аренды в разделе «Тарифы» кабинета.</p>
    <BaseButton @click="emit('back')">В кабинет</BaseButton>
  </section>
  <section v-else class="grid align-items-start gap-4 pt-4 booking-view__layout">
    <BookingSummary
      :service="service"
      :quantity="quantity"
      :guest-count="guestCount"
      :total-price="totalPrice"
      :is-admin="true"
      @back="emit('back')"
    />
    <BookingConfirmation
      v-if="success"
      :booking="success"
      :is-admin="true"
      @show="emit('show', success)"
      @another="reset"
    />
    <form v-else class="card p-4 p-md-5 booking-view__form" @submit.prevent="submit">
      <h2 class="display-subtitle mb-3">Добавить бронь</h2>
      <p class="small text-body-secondary mb-4">Внесите договорённость после звонка клиента.</p>
      <ClientPicker v-model="customer" :clients="clients" />
      <label for="service" class="form-label mb-2 d-block small fw-semibold">Вариант аренды</label>
      <select id="service" v-model="service" class="form-select">
        <option v-for="item in services" :key="item.id" :value="item">{{ item.name }}</option>
      </select>
      <div class="booking-view__quantities">
        <NumberStepper
          id="rental-quantity"
          v-model="quantity"
          compact
          :label="service.rentalUnit === 'day' ? 'Сутки' : 'Часы'"
          :min="1"
          :max="maxQuantity"
        />
        <NumberStepper
          id="rental-guests"
          v-model="guestCount"
          compact
          label="Гости"
          :min="1"
          :max="maxGuestCount"
        />
      </div>
      <div class="booking-view__price mt-3" aria-live="polite">
        <small class="text-body-secondary">Стоимость аренды</small>
        <template v-if="totalPrice !== null">
          <p v-if="service.price" class="mt-2 mb-1">
            {{ money(service.price) }} × {{ guestCount }} чел. × {{ quantity }}
            {{ service.rentalUnit === 'day' ? 'сут.' : 'ч' }}
          </p>
          <strong class="d-block mt-1">Итого: {{ money(totalPrice) }}</strong>
        </template>
        <p v-else class="mb-0 mt-2">
          Укажите целое количество гостей и срок аренды в пределах поля.
        </p>
      </div>
      <p v-if="prefillNotice" role="status" class="alert practice-notice mt-3">
        {{ prefillNotice }}
      </p>
      <AvailabilityPicker
        :date="date"
        :time="time"
        :days="visibleDays"
        :slots="availableTimes"
        :day-count="availableDays.length"
        :page="dayPage"
        @date="selectDate"
        @time="time = $event"
        @page="changeDatePage"
      />
      <p v-if="end" class="booking-view__period mt-4 mb-0">
        <strong>Окончание аренды</strong><br />{{ fullDate(end.date) }} · {{ end.time }}
      </p>
      <p v-if="error" class="alert alert-warning mt-3 small" role="alert">{{ error }}</p>
      <BaseButton type="submit" class="mt-4 w-100" :disabled="!canSubmit"
        >Подтвердить бронь</BaseButton
      >
      <p class="mt-3 mb-0 text-center small text-body-secondary">
        Бронь закроет выбранное время в календаре. В демо данные хранятся до обновления вкладки.
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { bookingEnd, usePractice, type Booking } from '../../../entities/practice/index.ts';
import { useBookingForm } from '../model/useBookingForm.ts';
import { fullDate, money } from '../../../shared/lib/format/index.ts';
import { BaseButton, NumberStepper } from '../../../shared/ui/index.ts';
import ClientPicker from './ClientPicker.vue';
import AvailabilityPicker from './AvailabilityPicker.vue';
import BookingSummary from './BookingSummary.vue';
import BookingConfirmation from './BookingConfirmation.vue';

const store = usePractice();
const props = defineProps<{ initial?: { clientId?: string; date?: string } }>();
const emit = defineEmits<{ back: []; show: [booking: Booking] }>();
const { services, isAdmin, clients, selectedService } = store;
const {
  prefillNotice,
  customer,
  date,
  time,
  quantity,
  guestCount,
  maxGuestCount,
  totalPrice,
  maxQuantity,
  dayPage,
  error,
  success,
  canSubmit,
  availableDays,
  visibleDays,
  availableTimes,
  changeDatePage,
  selectDate,
  submit,
  reset,
} = useBookingForm(store, props.initial);
const service = computed({ get: () => selectedService.value, set: store.selectService });
const end = computed(() =>
  service.value &&
  date.value &&
  time.value &&
  Number.isInteger(quantity.value) &&
  quantity.value > 0 &&
  quantity.value <= maxQuantity.value
    ? bookingEnd({
        date: date.value,
        time: time.value,
        service: { ...service.value, duration: service.value.duration * quantity.value },
      })
    : null,
);
</script>

<style scoped>
@media (min-width: 768px) {
  .booking-view__layout {
    grid-template-columns: 0.9fr 1.2fr;
    padding-top: 3.5rem;
  }
}
@media (min-width: 992px) {
  .booking-view__layout {
    gap: 4.25rem;
  }
}
.booking-view__form {
  min-width: 0;
}
.booking-view__quantities {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
  margin-top: 20px;
}
.booking-view__period {
  padding: 16px;
  border-radius: 12px;
  background: var(--paper, #f5f2e9);
  font-size: 14px;
  line-height: 1.7;
}
.booking-view__price {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--brand);
  background: var(--paper, #f5f2e9);
}
</style>
