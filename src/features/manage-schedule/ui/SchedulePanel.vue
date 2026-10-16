<template>
  <aside class="schedule-panel">
    <ClosureEditor class="schedule-panel__editor" @show-bookings="emit('show-bookings', $event)" />
    <section class="card p-4 schedule-panel__periods">
      <h2 class="mb-3 fs-4 fw-semibold">Закрытые даты</h2>
      <p v-if="!breaks.length" class="small text-body-secondary">
        {{
          daysOff.length
            ? 'Пока действуют только регулярные выходные.'
            : 'Отдельных закрытых дат пока нет.'
        }}
      </p>
      <div v-for="item in sortedBreaks" :key="item.id" class="mt-3 border-top pt-3">
        <strong>{{ item.kind }}</strong>
        <p class="my-1 small">
          {{ fullDate(item.start)
          }}<template v-if="item.end !== item.start"> — {{ fullDate(item.end) }}</template>
        </p>
        <BaseButton
          variant="secondary"
          :aria-label="`Открыть даты: ${fullDate(item.start)}`"
          @click="removeBreak(item.id)"
          >Открыть даты</BaseButton
        >
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePractice } from '../../../entities/practice/index.ts';
import { fullDate } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
import ClosureEditor from './ClosureEditor.vue';
const emit = defineEmits<{ 'show-bookings': [date: string] }>();

const { daysOff, breaks, removeBreak } = usePractice();
const sortedBreaks = computed(() =>
  breaks.value.toSorted((a, b) => a.start.localeCompare(b.start)),
);
</script>
<style scoped>
.schedule-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.schedule-panel > * {
  min-width: 0;
}
@media (max-width: 767.98px) {
  .schedule-panel {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
}
</style>
