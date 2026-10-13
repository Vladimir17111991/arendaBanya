<template>
  <section>
    <h2 class="display-subtitle">Варианты аренды</h2>
    <p class="mt-3 mb-4 small text-body-secondary">
      Тестовые ставки указаны за одного гостя за час или сутки. Итоговая цена — ставка × количество
      гостей × срок аренды. Изменения сразу видны на сайте. Стоимость уже созданных броней
      сохраняется.
    </p>
    <CategoryManager />
    <div class="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
      <h3 class="fs-5 fw-semibold">Варианты аренды · {{ services.length }}</h3>
      <BaseButton :disabled="!categories.length" @click="adding = !adding">{{
        adding ? 'Закрыть форму' : 'Новый вариант аренды'
      }}</BaseButton>
    </div>
    <PriceEditorRow v-if="adding && categories.length" class="mb-4" @added="adding = false" />
    <p v-if="!services.length" class="mb-4 small text-body-secondary">
      Вариантов аренды пока нет. Пустой прайс не позволяет создать бронь.
    </p>
    <div class="grid align-items-start gap-3 grid-cols-md-2">
      <PriceEditorRow v-for="service in services" :key="service.id" :service="service" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePractice } from '../../../entities/practice/index.ts';
import PriceEditorRow from './PriceEditorRow.vue';
import CategoryManager from './CategoryManager.vue';
import { BaseButton } from '../../../shared/ui/index.ts';
const { services, categories } = usePractice();
const adding = ref(false);
</script>
