<template>
  <span class="action-arrow d-grid flex-shrink-0" aria-hidden="true">
    <svg
      class="action-arrow__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
    >
      <path
        :d="direction === 'down' ? 'M12 5v14m-6-6 6 6 6-6' : 'M7 17 17 7M7 7h10v10'"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ direction?: 'diagonal' | 'down' }>(), { direction: 'diagonal' });
</script>

<style scoped>
.action-arrow {
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid #fff4ef30;
  border-radius: 50%;
  background: var(--action-arrow-bg, #fff4ef12);
  transition: background-color 450ms ease;
}
.action-arrow__icon {
  width: 18px;
  height: 18px;
  transform: var(--action-arrow-shift);
  transition: transform 450ms cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
