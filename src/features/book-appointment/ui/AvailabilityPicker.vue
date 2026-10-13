<template>
  <fieldset class="mt-4 availability-picker__group">
    <legend class="mb-3 small fw-semibold fs-6">Доступные даты</legend>
    <p class="mb-3 small text-body-secondary">
      На ближайшие 90 дней. Выходные, отпуск и занятые дни скрыты.
    </p>
    <div class="grid grid-cols-3 gap-2 grid-cols-md-4">
      <button
        v-for="day in days"
        :key="day"
        type="button"
        class="btn rounded-2 px-2 py-3"
        :class="date === day ? 'btn-primary' : 'btn-outline-primary'"
        :aria-pressed="date === day"
        :aria-label="fullDate(day)"
        @click="$emit('date', day)"
      >
        <small class="mb-2 d-block small">{{ dayName(day) }}</small
        ><strong class="d-block small text-nowrap">{{ shortDate(day) }}</strong>
      </button>
    </div>
    <div
      v-if="dayCount > 7"
      class="mt-2 d-flex align-items-center justify-content-between small text-body-secondary"
    >
      <BaseButton variant="text" :disabled="page === 0" @click="$emit('page', -1)"
        >Раньше</BaseButton
      >
      <span>{{ page + 1 }} / {{ Math.ceil(dayCount / 7) }}</span>
      <BaseButton variant="text" :disabled="(page + 1) * 7 >= dayCount" @click="$emit('page', 1)"
        >Позже</BaseButton
      >
    </div>
  </fieldset>
  <p v-if="!dayCount" class="mt-3 border p-4 text-center small availability-picker__empty">
    На ближайшие 90 дней свободных дат нет. Попробуйте изменить длительность или вариант аренды.
  </p>
  <fieldset v-if="date" class="mt-4 availability-picker__group">
    <legend class="mb-3 small fw-semibold fs-6">Начало аренды · {{ shortDate(date) }}</legend>
    <div class="d-flex flex-wrap gap-2">
      <button
        v-for="slot in slots"
        :key="slot"
        type="button"
        class="btn rounded-2 px-3 py-2 small availability-picker__slot"
        :class="time === slot ? 'btn-primary' : 'btn-outline-primary'"
        :aria-pressed="time === slot"
        @click="$emit('time', slot)"
      >
        {{ slot }}
      </button>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { dayName, fullDate, shortDate } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';

defineProps<{
  date: string;
  time: string;
  days: string[];
  slots: string[];
  dayCount: number;
  page: number;
}>();
defineEmits<{ date: [value: string]; time: [value: string]; page: [delta: number] }>();
</script>

<style scoped>
.availability-picker__group {
  min-width: 0;
}
.availability-picker__empty {
  border-style: dashed;
}
.availability-picker__slot {
  flex: 1 0 65px;
}
</style>
