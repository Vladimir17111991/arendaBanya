import { computed, ref, watch } from 'vue';
import { usePractice } from '../../../entities/practice/index.ts';
export function useCategoryFilter() {
  const { categories } = usePractice();
  const category = ref(0);
  const options = computed(() => [{ id: 0, name: 'Все' }, ...categories.value]);
  const categoryName = computed(
    () => options.value.find((item) => item.id === category.value)?.name ?? 'Все',
  );
  watch(options, (list) => {
    if (!list.some((item) => item.id === category.value)) category.value = 0;
  });
  return { category, categories: options, categoryName };
}
