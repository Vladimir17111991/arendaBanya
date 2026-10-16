<template>
  <input
    :value="display"
    type="tel"
    inputmode="tel"
    autocomplete="tel"
    :maxlength="PHONE_MAX_LENGTH"
    :pattern="PHONE_PATTERN"
    placeholder="+375 (XX) XXX-XX-XX"
    title="Введите номер полностью: +375 (XX) XXX-XX-XX"
    @focus="onFocus"
    @beforeinput="onBeforeInput"
    @input="onInput"
    @paste="onPaste"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  editPhone,
  formatPhone,
  PHONE_MAX_LENGTH,
  PHONE_PATTERN,
  PHONE_PREFIX,
} from '../lib/phone/index.ts';
const model = defineModel<string>({ required: true });
const display = computed(() => formatPhone(model.value));
function update(input: HTMLInputElement, value: string, caret = value.length) {
  model.value = value;
  input.value = value;
  input.setSelectionRange(caret, caret);
}
function onFocus(event: FocusEvent) {
  const input = event.target as HTMLInputElement;
  if (!model.value) update(input, PHONE_PREFIX);
}
function onBeforeInput(event: InputEvent) {
  const input = event.target as HTMLInputElement;
  if (!event.cancelable) return;
  const deleting = event.inputType.startsWith('delete');
  if (!deleting && event.data === null) return;
  event.preventDefault();
  if (!deleting && !/\d/.test(event.data ?? '')) return;
  const result = editPhone(
    input.value,
    input.selectionStart ?? input.value.length,
    input.selectionEnd ?? input.value.length,
    deleting ? '' : (event.data ?? ''),
    deleting ? (event.inputType.includes('Backward') ? 'backward' : 'forward') : undefined,
  );
  update(input, result.value, result.caret);
}
// Autofill and input methods which do not dispatch a cancelable beforeinput.
function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  update(input, formatPhone(input.value));
}
function onPaste(event: ClipboardEvent) {
  if (!event.clipboardData) return;
  event.preventDefault();
  const input = event.target as HTMLInputElement;
  const pasted = event.clipboardData.getData('text');
  const digits = pasted.replace(/\D/g, '');
  if (!digits || (pasted.trim().startsWith('+') && !digits.startsWith('375'))) return;
  if (digits.length >= 9 || digits.startsWith('375') || digits.startsWith('80')) {
    update(input, formatPhone(pasted));
    return;
  }
  const result = editPhone(
    input.value,
    input.selectionStart ?? input.value.length,
    input.selectionEnd ?? input.value.length,
    pasted,
  );
  update(input, result.value, result.caret);
}
</script>
