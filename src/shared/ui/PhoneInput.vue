<template>
  <input
    :value="display"
    type="tel"
    inputmode="tel"
    autocomplete="tel"
    placeholder="+375 29 123 45 67"
    @focus="onFocus"
    @input="onInput"
    @keydown="onKeydown"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatPhone } from '../lib/phone/index.ts';
const model = defineModel<string>({ required: true });
const display = computed(() => formatPhone(model.value));
function onFocus() {
  if (!model.value) model.value = '+375';
}
function update(input: HTMLInputElement, raw: string, caret: number) {
  const formatted = formatPhone(raw);
  const digitsBefore =
    raw.slice(0, caret).replace(/\D/g, '').length +
    Math.max(0, formatted.replace(/\D/g, '').length - raw.replace(/\D/g, '').length);
  model.value = formatted;
  input.value = formatted;
  let count = 0;
  let position = formatted.startsWith('+') ? 1 : 0;
  while (position < formatted.length && count < digitsBefore) {
    if (/\d/.test(formatted[position]!)) count++;
    position++;
  }
  input.setSelectionRange(position, position);
}
function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  update(input, input.value, input.selectionStart ?? input.value.length);
}
function onKeydown(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement;
  const caret = input.selectionStart ?? 0;
  if (
    event.key !== 'Backspace' ||
    caret !== input.selectionEnd ||
    !caret ||
    /\d/.test(input.value[caret - 1]!)
  )
    return;
  let previous = caret - 1;
  while (previous >= 0 && !/\d/.test(input.value[previous]!)) previous--;
  if (previous < 0) return;
  event.preventDefault();
  update(input, input.value.slice(0, previous) + input.value.slice(caret), previous);
}
</script>
