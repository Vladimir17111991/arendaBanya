<template>
  <div class="number-stepper">
    <div class="number-stepper__heading">
      <label :for="id" class="number-stepper__label">{{ label }}</label>
      <span v-if="hasUsableBounds" class="number-stepper__range" aria-hidden="true"
        >{{ min }}–{{ max }}</span
      >
    </div>
    <div class="number-stepper__controls">
      <button
        type="button"
        class="number-stepper__button"
        :aria-label="'Уменьшить: ' + label"
        :aria-controls="id"
        :disabled="decreaseDisabled"
        @click="step(-1)"
      >
        <span aria-hidden="true">−</span>
      </button>
      <div class="number-stepper__value">
        <input
          :id="id"
          :value="displayValue"
          class="number-stepper__input"
          type="number"
          inputmode="numeric"
          :min="min"
          :max="max"
          step="1"
          required
          :disabled="!hasUsableBounds"
          :aria-describedby="suffix ? id + '-suffix' : undefined"
          @input="update"
        />
        <span v-if="suffix" :id="id + '-suffix'" class="number-stepper__suffix">{{ suffix }}</span>
      </div>
      <button
        type="button"
        class="number-stepper__button number-stepper__button--increase"
        :aria-label="'Увеличить: ' + label"
        :aria-controls="id"
        :disabled="increaseDisabled"
        @click="step(1)"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  id: string;
  label: string;
  modelValue: number | string;
  min: number;
  max: number;
  suffix?: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const value = computed(() =>
  String(props.modelValue).trim() ? Number(props.modelValue) : Number.NaN,
);
const hasFiniteValue = computed(() => Number.isFinite(value.value));
const hasUsableBounds = computed(
  () => Number.isFinite(props.min) && Number.isFinite(props.max) && props.min <= props.max,
);
const displayValue = computed(() => (hasFiniteValue.value ? props.modelValue : ''));
const decreaseDisabled = computed(
  () => !hasUsableBounds.value || (hasFiniteValue.value && value.value <= props.min),
);
const increaseDisabled = computed(
  () => !hasUsableBounds.value || (hasFiniteValue.value && value.value >= props.max),
);

function update(event: Event) {
  // Keep a cleared field empty; parent validation decides whether it can be submitted.
  emit('update:modelValue', (event.target as HTMLInputElement).valueAsNumber);
}
function step(direction: -1 | 1) {
  if (
    !hasUsableBounds.value ||
    (direction === -1 ? decreaseDisabled.value : increaseDisabled.value)
  )
    return;
  const next = hasFiniteValue.value
    ? direction === 1
      ? Math.floor(value.value) + 1
      : Math.ceil(value.value) - 1
    : props.min;
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, next)));
}
</script>

<style scoped>
.number-stepper {
  min-width: 0;
  padding: 15px;
  border: 1px solid var(--line, #d9ddce);
  border-radius: 18px;
  background: var(--surface-soft, #fffef9);
}
.number-stepper__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.number-stepper__label {
  min-width: 0;
  color: var(--ink, #30382b);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}
.number-stepper__range {
  flex-shrink: 0;
  color: var(--muted, #646b58);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.number-stepper__controls {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) 50px;
  align-items: center;
  gap: 8px;
}
.number-stepper__button {
  display: grid;
  place-items: center;
  width: 50px;
  height: 54px;
  padding: 0;
  border: 1px solid var(--line, #cdd5bd);
  border-radius: 14px;
  background: var(--control-bg, #e8eddc);
  color: var(--brand, #526344);
  font-size: 29px;
  line-height: 1;
  transition:
    background-color 160ms,
    color 160ms,
    border-color 160ms;
}
.number-stepper__button--increase {
  border-color: var(--selected-bg, #526344);
  background: var(--selected-bg, #526344);
  color: var(--selected-text, #fff);
}
.number-stepper__button:hover:not(:disabled) {
  border-color: var(--focus, #35452c);
  background: var(--selected-bg, #35452c);
  color: var(--selected-text, #fff);
}
.number-stepper__button:disabled {
  border-color: var(--line, #e2e5d8);
  background: var(--surface, #f0f1e9);
  color: var(--muted, #9ca58e);
  opacity: 0.5;
}
.number-stepper__value {
  min-width: 0;
  text-align: center;
}
.number-stepper__input {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--brand, #526344);
  font-size: 28px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  text-align: center;
  appearance: textfield;
  -moz-appearance: textfield;
}
.number-stepper__input::-webkit-inner-spin-button,
.number-stepper__input::-webkit-outer-spin-button {
  margin: 0;
  -webkit-appearance: none;
}
.number-stepper__suffix {
  display: block;
  max-width: 100%;
  color: var(--muted, #646b58);
  font-size: 14px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.number-stepper__button:focus-visible,
.number-stepper__input:focus-visible {
  outline: 3px solid var(--focus, var(--accent, #829767));
  outline-offset: 3px;
}
@media (max-width: 359.98px) {
  .number-stepper {
    padding: 12px;
  }
  .number-stepper__controls {
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    gap: 5px;
  }
  .number-stepper__button {
    width: 44px;
    height: 50px;
  }
  .number-stepper__input {
    font-size: 25px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .number-stepper__button {
    transition: none;
  }
}
</style>
