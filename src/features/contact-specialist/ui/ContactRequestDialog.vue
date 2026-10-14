<template>
  <dialog
    ref="dialog"
    class="contact-request"
    aria-labelledby="contact-request-title"
    @cancel.prevent="emit('close')"
    @close="emit('closed')"
    @click="$event.target === $event.currentTarget && emit('close')"
  >
    <div class="contact-request__content position-relative">
      <button
        class="contact-request__close position-absolute d-grid p-0"
        type="button"
        aria-label="Закрыть окно связи"
        @click="emit('close')"
      >
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
      <h2 id="contact-request-title" class="contact-request__title">Связаться с нами</h2>
      <ContactForm :initial-message="request?.message" />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';
import type { ContactRequest } from '../model/useContactRequest.ts';
import ContactForm from './ContactForm.vue';

const props = defineProps<{ request: ContactRequest | null }>();
const emit = defineEmits<{ close: []; closed: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);

watch(
  () => props.request,
  async (request) => {
    await nextTick();
    if (request && props.request === request) dialog.value?.showModal();
    else if (!props.request) dialog.value?.close();
  },
);
onUnmounted(() => dialog.value?.close());
</script>

<style scoped>
.contact-request {
  width: min(540px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid #fff9f4;
  border-radius: 26px;
  color: var(--ink);
  background: var(--surface-raised);
  box-shadow: 0 28px 90px #38263050;
}
.contact-request::backdrop {
  background: #38263080;
  backdrop-filter: blur(5px);
}
.contact-request__content {
  padding: 38px;
}
.contact-request__close {
  top: 12px;
  right: 12px;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid #dfc8d0;
  border-radius: 50%;
  color: var(--brand);
  background: #fffaf6;
  font-size: 26px;
  line-height: 1;
}
.contact-request__preview-label {
  margin: 0 24px 16px 0;
  color: var(--muted);
  font-size: 14px;
}
.contact-request__title {
  margin: 0 0 16px;
  font-family: var(--display);
  font-size: 34px;
}
.contact-request__text {
  line-height: 1.7;
}
.contact-request__label {
  margin: 22px 0 8px;
  font-size: 14px;
}
.contact-request__message {
  padding: 16px;
  border: 1px solid #d5b8c4;
  border-radius: 14px;
  color: var(--ink);
  background: #fffaf6;
  font-size: 16px;
  line-height: 1.6;
  user-select: text;
  -webkit-user-select: text;
  -webkit-touch-callout: default;
  overflow-wrap: anywhere;
}
.contact-request__copy {
  margin-top: 18px;
}
.contact-request__note {
  margin: 20px 0 0;
  font-size: 14px;
  color: var(--muted);
}
.contact-request__confirmation {
  margin: 18px 0 0;
  padding-top: 18px;
  border-top: 1px solid #dfc8d0;
  font-size: 14px;
}
.contact-request__status {
  margin: 12px 0 0;
  font-size: 14px;
  color: var(--brand);
}
.contact-request__status:empty {
  display: none;
}
@media (max-width: 575.98px) {
  .contact-request__content {
    padding: 32px 23px 25px;
  }
  .contact-request__title {
    font-size: 29px;
  }
  .contact-request__copy {
    width: 100%;
  }
}

.contact-request .contact-request__close {
  width: 46px;
  height: 46px;
  border: 1px solid #c578df;
  border-radius: 50%;
  background: linear-gradient(115deg, #8033a7, #a22b87);
  color: white;
  box-shadow: 0 4px 20px #0008;
}
.contact-request .contact-request__close:hover {
  background: linear-gradient(115deg, #953bb3, #b83298);
}
.contact-request__title {
  padding-right: 36px;
}
</style>
