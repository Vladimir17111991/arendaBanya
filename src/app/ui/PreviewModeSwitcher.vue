<template>
  <div class="border-bottom bg-light px-4 py-3">
    <div
      class="mx-auto d-flex flex-wrap align-items-center justify-content-between gap-3 preview-mode-switcher__container"
    >
      <p class="small text-body-secondary">
        Сравнение концепций <span class="mx-1">·</span> демонстрация
      </p>
      <div
        class="d-flex rounded-3 border border-secondary-subtle p-1"
        role="group"
        aria-label="Вариант сайта"
      >
        <button
          type="button"
          class="rounded-2 px-3 py-2 small fw-semibold preview-mode-switcher__button"
          :class="
            mode === 'dikidi'
              ? 'bg-primary text-white shadow-sm'
              : 'text-body-secondary preview-mode-switcher__button--inactive'
          "
          :aria-pressed="mode === 'dikidi'"
          @click="mode = 'dikidi'"
        >
          Макет DIKIDI
        </button>
        <button
          type="button"
          class="rounded-2 px-3 py-2 small fw-semibold preview-mode-switcher__button"
          :class="
            mode === 'custom'
              ? 'bg-primary text-white shadow-sm'
              : 'text-body-secondary preview-mode-switcher__button--inactive'
          "
          :aria-pressed="mode === 'custom'"
          @click="mode = 'custom'"
        >
          Сайт Виктории
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const mode = defineModel<'dikidi' | 'custom'>({ required: true });
</script>

<style scoped>
.preview-mode-switcher__container {
  max-width: 1160px;
}
.preview-mode-switcher__button {
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}
.preview-mode-switcher__button--inactive:hover {
  background-color: #ffffff99;
}
</style>
