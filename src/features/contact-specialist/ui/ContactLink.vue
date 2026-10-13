<template>
  <a v-if="phone.href" :href="phone.href"><slot /></a>
  <button v-else type="button" @click="open(serviceName)"><slot /></button>
</template>

<script setup lang="ts">
import { phone } from '../../../entities/specialist/index.ts';
import { useContactRequest } from '../model/useContactRequest.ts';
defineProps<{ serviceName?: string }>();
const open = useContactRequest();
</script>
