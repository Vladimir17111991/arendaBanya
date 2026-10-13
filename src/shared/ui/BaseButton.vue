<template>
  <button :type="type" class="btn rounded-3" :class="variants[variant]"><slot /></button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'text' | 'danger';
    type?: 'button' | 'submit' | 'reset';
  }>(),
  { variant: 'primary', type: 'button' },
);
const variants = {
  primary: 'btn-primary',
  secondary: 'btn-outline-primary',
  text: 'btn-link',
  danger: 'btn-outline-danger',
};
</script>
