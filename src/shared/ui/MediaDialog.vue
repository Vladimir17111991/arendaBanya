<template>
  <dialog
    ref="dialog"
    class="media-dialog"
    :aria-labelledby="titleId"
    @cancel.prevent="emit('close')"
    @click="$event.target === $event.currentTarget && emit('close')"
    @close="restoreFocus"
  >
    <div
      v-if="!embeddedHeader"
      class="media-dialog__header d-flex align-items-center justify-content-between gap-3"
    >
      <h2 :id="titleId" ref="heading" tabindex="-1" class="media-dialog__title m-0">{{ title }}</h2>
      <DialogClose class="media-dialog__close" label="Закрыть просмотр" @click="emit('close')" />
    </div>
    <div class="media-dialog__content"><slot :title-id="titleId" /></div>
  </dialog>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, useId, watch } from 'vue';
import DialogClose from './DialogClose.vue';
const props = defineProps<{ open: boolean; title: string; embeddedHeader?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const titleId = useId();
const dialog = ref<HTMLDialogElement | null>(null);
const heading = ref<HTMLElement | null>(null);
let trigger: HTMLElement | null = null;
watch(
  () => props.open,
  async (open) => {
    if (open)
      trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await nextTick();
    if (open && props.open) {
      dialog.value?.showModal();
      const title = heading.value ?? document.getElementById(titleId);
      title?.focus({ preventScroll: true });
    } else if (!props.open) dialog.value?.close();
  },
);
function restoreFocus() {
  if (props.open) emit('close');
  if (trigger?.isConnected) trigger.focus({ preventScroll: true });
}
onUnmounted(() => dialog.value?.close());
</script>

<style scoped>
.media-dialog {
  width: min(960px, calc(100% - 24px));
  max-height: calc(100dvh - 24px);
  border: 1px solid #fff;
  border-radius: 22px;
  padding: 0;
  color: var(--ink);
  background: #fff8f3;
  box-shadow: 0 24px 80px #3f373170;
  overscroll-behavior: contain;
}
.media-dialog::backdrop {
  background: #3b2e23ba;
  backdrop-filter: blur(6px);
}
.media-dialog__header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff8f3f5;
  border-bottom: 1px solid #dac1c955;
  padding: 14px 20px;
}
.media-dialog__title {
  font-family: var(--display);
  font-size: 25px;
  font-weight: 400;
}
.media-dialog__content {
  padding: 18px;
}
@media (max-width: 767.98px) {
  .media-dialog__header {
    padding: 12px 16px;
  }
  .media-dialog__title {
    font-size: 21px;
  }
}
.media-dialog__title:focus {
  outline: none;
}
</style>
