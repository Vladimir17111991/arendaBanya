<template>
  <div class="calendar-stage" :class="{ 'calendar-stage--backward': direction < 0 }">
    <div class="calendar-stage__header"><slot name="header" /></div>
    <div class="calendar-stage__viewport">
      <div :key="month" class="calendar-stage__page"><slot /></div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ month: string; direction: number }>();
</script>
<style scoped>
.calendar-stage {
  margin: 26px 0 20px;
  padding: 20px 8px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface-soft);
}
.calendar-stage__header {
  padding: 0 8px 18px;
}
.calendar-stage__viewport {
  overflow: hidden;
}
.calendar-stage__page {
  animation: month-forward 280ms ease-out;
}
.calendar-stage--backward .calendar-stage__page {
  animation-name: month-backward;
}
@keyframes month-forward {
  from {
    opacity: 0;
    transform: translateX(22px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes month-backward {
  from {
    opacity: 0;
    transform: translateX(-22px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .calendar-stage__page {
    animation: none;
  }
}
</style>
