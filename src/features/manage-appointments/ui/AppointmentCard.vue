<template>
  <article
    class="appointment-card card mt-3"
    :style="{
      borderLeft: `6px solid ${categoryColor(booking.service.categoryId)}`,
      background: `color-mix(in srgb, ${categoryColor(booking.service.categoryId)} 14%, var(--surface))`,
    }"
    :class="{ 'appointment-card--cancelled': booking.status === 'cancelled' }"
  >
    <div class="appointment-card__body">
      <div class="appointment-card__time">
        <strong class="appointment-card__start">{{ booking.time }}</strong>
        <small class="appointment-card__date">{{ shortDate(booking.date) }}</small>
        <span class="appointment-card__end">до {{ end.time }}</span>
        <small v-if="end.date !== booking.date" class="appointment-card__date">{{
          shortDate(end.date)
        }}</small>
      </div>
      <div class="appointment-card__details">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
          <h3 class="fs-5 fw-semibold mb-0 text-break">
            {{ isAdmin ? booking.name : booking.service.name }}
          </h3>
          <span
            class="appointment-card__status"
            :class="'appointment-card__status--' + booking.status"
            >{{ statusLabel }}</span
          >
        </div>
        <p v-if="isAdmin" class="mb-1">{{ booking.service.name }}</p>
        <p class="small mb-2">{{ booking.service.category }}</p>
        <p class="small text-muted mb-2">
          Гостей: {{ booking.guestCount ?? 1 }} ·
          {{
            booking.service.rentalUnit === 'day'
              ? `Суток: ${booking.service.duration / 1440}`
              : `Часов: ${booking.service.duration / 60}`
          }}
        </p>
        <p v-if="booking.unitPrice" class="small text-muted mb-1">
          {{ money(booking.unitPrice) }} × {{ booking.guestCount ?? 1 }} чел. × {{ quantity }}
          {{ booking.service.rentalUnit === 'day' ? 'сут.' : 'ч' }}
        </p>
        <p class="small fw-semibold mb-2">Итого: {{ money(booking.service.price) }}</p>
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <a
            v-if="isAdmin"
            :href="'tel:' + booking.phone.replace(/[^+\d]/g, '')"
            class="appointment-card__phone"
            >{{ booking.phone }}</a
          >
        </div>
        <p v-if="booking.reminder" class="small text-muted mt-2 mb-0">
          Напоминание за 24 часа · демо
        </p>
      </div>
    </div>
    <div v-if="booking.status !== 'cancelled'" class="appointment-card__actions">
      <BaseButton
        v-if="isAdmin && booking.status === 'confirmed'"
        class="appointment-card__action"
        variant="secondary"
        :disabled="!canComplete"
        :title="canComplete ? 'Отметить завершённую аренду' : 'Доступно после окончания аренды'"
        @click="$emit('complete')"
        >Отдых состоялся</BaseButton
      >
      <BaseButton
        v-if="isAdmin && booking.status === 'completed'"
        class="appointment-card__action"
        variant="text"
        @click="$emit('undo')"
        >Снять отметку</BaseButton
      >
      <BaseButton
        v-if="booking.status === 'confirmed' && !confirming"
        class="appointment-card__action"
        variant="text"
        @click="$emit('requestCancel')"
        >Отменить бронь</BaseButton
      >
    </div>
    <div v-if="confirming" class="border-top p-3" role="group" aria-label="Подтверждение отмены">
      <p class="mb-3 small">
        Отменить бронь {{ booking.name }} на {{ shortDate(booking.date) }} в {{ booking.time }}?
      </p>
      <div class="d-flex flex-wrap gap-2">
        <BaseButton variant="danger" @click="$emit('cancel')">Да, отменить</BaseButton>
        <BaseButton variant="text" @click="$emit('keep')">Оставить бронь</BaseButton>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { categoryColor } from '../model/categoryColor.ts';
import { bookingEnd, type Booking } from '../../../entities/practice/index.ts';
import { money, shortDate } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
const props = defineProps<{
  booking: Booking;
  isAdmin: boolean;
  confirming: boolean;
  canComplete: boolean;
}>();
defineEmits<{ requestCancel: []; cancel: []; keep: []; complete: []; undo: [] }>();
const statusLabel = computed(
  () =>
    ({ confirmed: 'Подтверждена', completed: 'Завершена', cancelled: 'Отменена' })[
      props.booking.status
    ],
);
const end = computed(() => bookingEnd(props.booking));
const quantity = computed(
  () =>
    props.booking.quantity ??
    props.booking.service.duration / (props.booking.service.rentalUnit === 'day' ? 1440 : 60),
);
</script>

<style scoped>
.appointment-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 5px 20px #34462608;
}
.appointment-card--cancelled {
  background: #f2f1e9;
}
.appointment-card__body {
  display: flex;
  gap: 20px;
  padding: 22px;
}
.appointment-card__time {
  flex-shrink: 0;
  width: 64px;
  border-right: 1px solid var(--line);
  color: var(--brand);
}
.appointment-card__start {
  display: block;
  font-size: 21px;
}
.appointment-card__end {
  display: block;
  font-size: 13px;
  color: var(--muted);
  margin: 6px 0 0;
}
.appointment-card__date {
  display: block;
  font-size: 10px;
}
.appointment-card__details {
  min-width: 0;
}
.appointment-card__status {
  padding: 5px 9px;
  border-radius: 7px;
  font-size: 10px;
}
.appointment-card__status--confirmed {
  color: #75552b;
  background: #faf0de;
}
.appointment-card__status--completed {
  color: #39664d;
  background: #e9f1e8;
}
.appointment-card__status--cancelled {
  color: #616953;
  background: #e7e9dc;
}
.appointment-card__visit {
  padding: 5px 9px;
  border-radius: 8px;
  font-size: 12px;
  background: #e9eddc;
  color: var(--brand);
}
.appointment-card__phone {
  font-size: 12px;
  text-underline-offset: 4px;
  padding: 8px 0;
}
.appointment-card__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 22px;
  border-top: 1px solid var(--line);
  background: #fffdf6;
}
.appointment-card__action {
  font-size: 12px;
  min-height: 44px;
  padding: 10px 14px;
}
@media (max-width: 575.98px) {
  .appointment-card__body {
    padding: 16px 12px;
    gap: 12px;
  }
  .appointment-card__time {
    width: 56px;
  }
  .appointment-card__actions {
    padding: 12px;
    gap: 8px;
  }
  .appointment-card__action {
    flex: 1;
  }
}
</style>
