<template>
  <nav class="review-pagination" :aria-label="label">
    <span class="review-pagination__summary" aria-live="polite"
      >{{ first }}–{{ last }} из {{ total }}</span
    >
    <div class="review-pagination__buttons">
      <button
        type="button"
        aria-label="Предыдущая страница отзывов"
        :disabled="disabled || page <= 1"
        @click="emit('change', page - 1)"
      >
        ‹
      </button>
      <button
        v-for="number in pages"
        :key="number"
        type="button"
        :aria-label="'Страница ' + number"
        :aria-current="number === page ? 'page' : undefined"
        :disabled="disabled"
        @click="number !== page && emit('change', number)"
      >
        {{ number }}
      </button>
      <button
        type="button"
        aria-label="Следующая страница отзывов"
        :disabled="disabled || page >= pageCount"
        @click="emit('change', page + 1)"
      >
        ›
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { REVIEW_PAGE_SIZE } from '../../../entities/review/index.ts';
const props = defineProps<{
  page: number;
  pageCount: number;
  total: number;
  disabled: boolean;
  label: string;
}>();
const emit = defineEmits<{ change: [page: number] }>();
const first = computed(() => (props.page - 1) * REVIEW_PAGE_SIZE + 1);
const last = computed(() => Math.min(props.page * REVIEW_PAGE_SIZE, props.total));
const pages = computed(() => {
  const count = Math.min(3, props.pageCount);
  const start = Math.min(Math.max(1, props.page - 1), props.pageCount - count + 1);
  return Array.from({ length: count }, (_, index) => start + index);
});
</script>

<style scoped>
.review-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-block: 4px 16px;
}
.review-pagination__summary {
  color: var(--muted);
  font-size: 14px;
}
.review-pagination__buttons {
  display: flex;
  gap: 6px;
}
.review-pagination button {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--ink);
  background: var(--surface);
  font-size: 16px;
}
.review-pagination button:first-child,
.review-pagination button:last-child {
  font-size: 28px;
  line-height: 1;
}
.review-pagination button[aria-current='page'] {
  border-color: var(--accent);
  background: var(--selected-bg);
}
.review-pagination button:disabled {
  opacity: 0.45;
  cursor: default;
}
.review-pagination button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
@media (max-width: 575px) {
  .review-pagination {
    justify-content: center;
  }
  .review-pagination__summary {
    width: 100%;
    text-align: center;
  }
}
</style>
