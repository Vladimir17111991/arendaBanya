<template>
  <section class="availability-times" :aria-labelledby="titleId">
    <div class="availability-times__heading">
      <h3 :id="titleId">Свободное время</h3>
      <p aria-live="polite">{{ date ? fullDate(date) : 'Выберите день' }}</p>
    </div>
    <div class="availability-times__content">
      <ul
        v-if="date && slots.length"
        class="availability-times__slots"
        aria-label="Свободные интервалы"
      >
        <li v-for="time in slots" :key="time">{{ time }}–{{ endTime(time) }}</li>
      </ul>
      <p v-else role="status" class="availability-times__empty">
        {{
          date
            ? 'На эту дату свободного времени нет. Выберите другой день.'
            : 'Нажмите на дату в календаре — здесь появятся свободные интервалы.'
        }}
      </p>
    </div>
    <p class="availability-times__note">Точное время согласуйте при обращении.</p>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { fullDate } from '../../../shared/lib/format/index.ts';
const props = defineProps<{ date: string; slots: string[]; quantity: number }>();
const titleId = useId();
function endTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return `${String((hours! + props.quantity) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
</script>

<style scoped>
.availability-times {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface-soft);
}
.availability-times__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.availability-times__heading h3 {
  margin: 0;
  font: 400 20px/1.2 var(--display);
}
.availability-times__heading p,
.availability-times__note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted);
}
.availability-times__content {
  max-height: var(--availability-times-height, 154px);
  margin-top: 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.availability-times__slots {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.availability-times__slots li {
  display: grid;
  place-items: center;
  min-height: 34px;
  padding: 6px 4px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--control-bg);
  color: var(--brand);
  font-size: 14px;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.availability-times__empty {
  display: grid;
  place-content: center;
  min-height: 114px;
  max-width: 350px;
  margin: 0 auto;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}
.availability-times__note {
  margin-top: 8px;
}
</style>
