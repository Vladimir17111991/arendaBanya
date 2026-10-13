<template>
  <article class="d-flex flex-column rounded-3 border border bg-white p-4">
    <div class="d-flex justify-content-between small text-body-secondary">
      <span>{{ service.category }}</span
      ><span>0{{ index + 1 }}</span>
    </div>
    <h3 class="mt-4 mb-2 fs-5 fw-semibold">{{ service.name }}</h3>
    <p class="mb-4 flex-grow-1 small text-body-secondary">{{ service.description }}</p>
    <div class="d-flex align-items-center justify-content-between gap-2">
      <div>
        <strong class="d-block fs-5">{{ money(service.price) }}</strong
        ><small class="mt-1 d-block small text-body-secondary">{{ service.duration }} минут</small>
      </div>
      <BaseButton
        v-if="canBook"
        variant="secondary"
        :aria-label="`Записаться: ${service.name}`"
        @click="$emit('select', service)"
        >Выбрать</BaseButton
      >
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Service } from '../../../entities/practice/index.ts';
import { money } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';

defineProps<{ service: Service; index: number; canBook: boolean }>();
defineEmits<{ select: [service: Service] }>();
</script>
