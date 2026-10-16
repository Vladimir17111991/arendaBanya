<template>
  <button type="button" class="dialog-close" :aria-label="label">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Закрыть окно' });
</script>

<style scoped>
.dialog-close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid #ba9268;
  border-radius: 50%;
  background: linear-gradient(115deg, #895f3b, #805736);
  color: #fff;
  box-shadow: 0 4px 20px #0008;
  cursor: pointer;
}
.dialog-close:hover {
  background: linear-gradient(115deg, #996c44, #966a43);
}
.dialog-close:focus-visible {
  outline: 2px solid var(--focus, #e2be8d);
  outline-offset: 3px;
}
</style>
