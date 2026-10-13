import { inject, provide, readonly, ref, type InjectionKey } from 'vue';
import { contactMessage } from '../lib/contactMessage.ts';

export interface ContactRequest {
  message: string;
}
const contactKey: InjectionKey<(serviceName?: string) => void> = Symbol('contact-request');

export function provideContactRequest() {
  const request = ref<ContactRequest | null>(null);
  let trigger: HTMLElement | null = null;
  function open(serviceName?: string) {
    trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    request.value = { message: contactMessage(serviceName) };
  }
  function close() {
    request.value = null;
  }
  function restoreFocus() {
    if (request.value) return;
    const target =
      trigger?.isConnected && trigger.getClientRects().length
        ? trigger
        : document.querySelector<HTMLElement>('.navbar-toggler');
    target?.focus({ preventScroll: true });
  }
  provide(contactKey, open);
  return {
    contactRequest: readonly(request),
    closeContactRequest: close,
    restoreContactFocus: restoreFocus,
  };
}
export function useContactRequest() {
  const open = inject(contactKey);
  if (!open) throw new Error('Contact requests are not provided');
  return open;
}
