<template>
  <section class="mb-5">
    <h3 class="mb-3 fs-5 fw-semibold">Категории прайса</h3>
    <form class="mb-3 d-flex flex-wrap align-items-end gap-3" @submit.prevent="add">
      <div class="flex-grow-1 category-manager__name-field">
        <label for="new-category" class="mb-2 d-block small">Новая категория</label
        ><input
          id="new-category"
          v-model="name"
          class="form-control"
          required
          maxlength="50"
          placeholder="Например, баня и проживание"
        />
      </div>
      <BaseButton type="submit">Добавить категорию</BaseButton>
    </form>
    <p v-if="error" role="alert" class="alert alert-warning mt-3 small mb-3">{{ error }}</p>
    <div class="grid gap-3">
      <CategoryEditorRow v-for="category in categories" :key="category.id" :category="category" />
    </div>
    <p v-if="!categories.length" class="rounded-3 workspace-surface p-3 small">
      Категорий пока нет. Добавьте первую, затем создайте вариант аренды.
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePractice } from '../../../entities/practice/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
import CategoryEditorRow from './CategoryEditorRow.vue';
const { categories, addCategory } = usePractice();
const name = ref('');
const error = ref('');
function add() {
  error.value = '';
  try {
    addCategory(name.value);
    name.value = '';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось добавить категорию.';
  }
}
</script>

<style scoped>
.category-manager__name-field {
  min-width: 10rem;
}
</style>
