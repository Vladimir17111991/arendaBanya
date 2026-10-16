<template>
  <div class="closure-conflicts" role="status">
    <div class="closure-conflicts__heading">
      <span class="closure-conflicts__icon" aria-hidden="true">!</span>
      <strong>Закрыть нельзя — есть брони: {{ bookings.length }}</strong>
    </div>
    <p>Сначала согласуйте перенос или отмену с клиентами.</p>
    <ul>
      <li v-for="item in bookings" :key="item.id">
        <button type="button" @click="emit('show-bookings', item.date)">
          <span class="closure-conflicts__time">{{ shortDate(item.date) }} · {{ item.time }}</span>
          <strong class="closure-conflicts__name">{{ item.name }}</strong>
          <span class="closure-conflicts__service">{{ item.service.name }}</span>
          <span class="closure-conflicts__action">Открыть бронь</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Booking } from '../../../entities/practice/index.ts';
import { shortDate } from '../../../shared/lib/format/index.ts';
defineProps<{ bookings: readonly Booking[] }>();
const emit = defineEmits<{ 'show-bookings': [date: string] }>();
</script>

<style scoped>
.closure-conflicts {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #bd8755;
  border-left: 4px solid #f3bd79;
  border-radius: 14px;
  background: #443021;
  color: #fff1dc;
}
.closure-conflicts__heading {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  line-height: 1.5;
}
.closure-conflicts__icon {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  height: 28px;
  border-radius: 50%;
  background: #f3bd79;
  color: #342410;
  font-weight: 800;
}
.closure-conflicts p {
  margin: 10px 0 14px;
  color: #e1c7aa;
  font-size: 14px;
  line-height: 1.5;
}
.closure-conflicts ul {
  display: grid;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.closure-conflicts button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  gap: 7px;
  padding: 16px;
  border: 1px solid #efd0a3;
  border-radius: 12px;
  background: #f4dfc0;
  color: #35271b;
  text-align: left;
  box-shadow: 0 4px 12px #1c120f26;
}
.closure-conflicts button:hover {
  background: #ffebcf;
  border-color: #fff5e8;
}
.closure-conflicts__time {
  font-size: 16px;
  font-weight: 700;
}
.closure-conflicts__name {
  font-size: 18px;
  overflow-wrap: anywhere;
}
.closure-conflicts__service {
  font-size: 14px;
  color: #634c35;
}
.closure-conflicts__action {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  margin-top: 3px;
  padding: 8px 16px;
  border-radius: 999px;
  background: #765033;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
</style>
