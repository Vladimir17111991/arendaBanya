<template>
  <button type="button" @click="open(serviceName)"><slot /></button>
</template>

<script setup lang="ts">
import { useContactRequest } from '../model/useContactRequest.ts';
defineProps<{ serviceName?: string }>();
const open = useContactRequest();
</script>
