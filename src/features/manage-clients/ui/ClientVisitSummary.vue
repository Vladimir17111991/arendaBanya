<template>
  <div class="w-100 border-top pt-3">
    <p class="small">
      <strong>Посещений: {{ visitsForClient(client.id) }}</strong
      ><span class="ms-3 small text-body-secondary"
        >Следующий: №{{ visitsForClient(client.id) + 1 }}</span
      >
    </p>
    <details class="mt-2">
      <summary class="small text-secondary text-decoration-underline link-offset-2">
        Учесть прошлые приезды
      </summary>
      <form class="mt-3" @submit.prevent="save" @input="saved = false">
        <label :for="`previous-visits-${client.id}`" class="mb-2 d-block small"
          >Сколько приездов было до начала учёта на сайте</label
        >
        <div class="d-flex flex-wrap align-items-center gap-3">
          <input
            :id="`previous-visits-${client.id}`"
            v-model="previous"
            type="number"
            min="0"
            max="10000"
            step="1"
            required
            class="form-control client-visit-summary__count"
          /><BaseButton type="submit" variant="secondary">Сохранить посещения</BaseButton>
        </div>
        <p class="mt-2 small text-body-secondary">
          Отмеченные на сайте приезды прибавляются автоматически. Повторно их сюда не включайте.
        </p>
        <p v-if="saved" role="status" class="mt-2 small text-secondary">Счётчик обновлён</p>
        <p v-if="error" role="alert" class="alert alert-warning mt-3 small">{{ error }}</p>
      </form>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type Client, usePractice } from '../../../entities/practice/index.ts';

import { BaseButton } from '../../../shared/ui/index.ts';
const props = defineProps<{ client: Client }>();
const { visitsForClient, setPreviousVisits } = usePractice();
const previous = ref<number | string>(props.client.previousVisits ?? 0);
const error = ref('');
const saved = ref(false);
function save() {
  error.value = '';
  saved.value = false;
  try {
    if (!String(previous.value).trim()) throw new Error('Введите число посещений.');
    setPreviousVisits(props.client.id, Number(previous.value));
    saved.value = true;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось сохранить.';
  }
}
</script>

<style scoped>
.client-visit-summary__count {
  max-width: 7rem;
}
</style>
