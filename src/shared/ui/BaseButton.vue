<template>
  <button
    :type="type"
    class="btn"
    :class="[variants[variant], pill ? 'rounded-pill' : 'rounded-3']"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'text' | 'danger';
    type?: 'button' | 'submit' | 'reset';
    pill?: boolean;
  }>(),
  { variant: 'primary', type: 'button', pill: false },
);
const variants = {
  primary: 'btn-primary',
  secondary: 'btn-outline-primary',
  text: 'btn-link',
  danger: 'btn-outline-danger',
};
</script>
