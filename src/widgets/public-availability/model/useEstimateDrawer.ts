import { ref } from 'vue';

export function useEstimateDrawer() {
  const visible = ref(false);
  const expanded = ref(false);
  let canAutoExpand = true;

  function reveal(expand = false) {
    visible.value = true;
    if (expand && canAutoExpand) {
      expanded.value = true;
      canAutoExpand = false;
    }
  }
  function toggle() {
    visible.value = true;
    expanded.value = !expanded.value;
    canAutoExpand = false;
  }
  function open() {
    visible.value = true;
    expanded.value = true;
    canAutoExpand = false;
  }
  function reset() {
    visible.value = false;
    expanded.value = false;
    canAutoExpand = true;
  }
  return { visible, expanded, reveal, toggle, open, reset };
}
