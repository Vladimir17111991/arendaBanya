<template>
  <div class="rounded-4 border workspace-surface p-3">
    <form class="d-flex flex-wrap align-items-end gap-3" @submit.prevent="save">
      <div class="flex-grow-1 category-editor-row__name-field">
        <label :for="`category-${category.id}`" class="mb-2 d-block small text-body-secondary"
          >Категория · вариантов аренды: {{ count }}</label
        ><input
          :id="`category-${category.id}`"
          v-model="name"
          class="form-control"
          required
          maxlength="50"
        />
      </div>
      <BaseButton
        type="submit"
        variant="secondary"
        :aria-label="`Сохранить категорию: ${category.name}`"
        >Сохранить</BaseButton
      >
      <BaseButton
        variant="text"
        :aria-label="`Удалить категорию: ${category.name}`"
        @click="
          removing = !removing;
          error = '';
          message = '';
        "
        >Удалить</BaseButton
      >
    </form>
    <div v-if="removing" class="mt-3 rounded-3 workspace-surface p-3">
      <p class="small">Удалить категорию «{{ category.name }}»?</p>
      <template v-if="count || photoCount">
        <p class="mt-2 small text-body-secondary">
          Вариантов аренды: {{ count }}, фотографий: {{ photoCount }}. Перенесите их в другую
          категорию. Существующие брони сохранятся.
        </p>
        <label
          :for="`move-category-${category.id}`"
          class="form-label mt-4 mb-2 d-block small fw-semibold"
          >Перенести в категорию</label
        ><select :id="`move-category-${category.id}`" v-model="destination" class="form-select">
          <option value="" disabled>Выберите категорию</option>
          <option v-for="item in otherCategories" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
        <p v-if="!otherCategories.length" class="mt-2 small text-body-secondary">
          Сначала создайте другую категорию или уберите из этой варианты аренды и фотографии.
        </p>
      </template>
      <div class="mt-3 d-flex flex-wrap gap-2">
        <BaseButton
          variant="danger"
          :disabled="(count > 0 || photoCount > 0) && !destination"
          :aria-label="`Подтвердить удаление категории: ${category.name}`"
          @click="remove"
          >{{
            count || photoCount ? 'Перенести и удалить категорию' : 'Удалить категорию'
          }}</BaseButton
        ><BaseButton variant="text" @click="removing = false">Оставить</BaseButton>
      </div>
    </div>
    <p v-if="error" role="alert" class="alert alert-warning mt-3 small">{{ error }}</p>
    <p v-if="message" role="status" class="mt-3 small text-secondary">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type Category, usePractice } from '../../../entities/practice/index.ts';

import { BaseButton } from '../../../shared/ui/index.ts';
const props = defineProps<{ category: Category }>();
const { categories, services, photos, renameCategory, removeCategory } = usePractice();
const name = ref(props.category.name);
const removing = ref(false);
const destination = ref<number | ''>('');
const error = ref('');
const message = ref('');
const count = computed(
  () => services.value.filter((item) => item.categoryId === props.category.id).length,
);
const otherCategories = computed(() =>
  categories.value.filter((item) => item.id !== props.category.id),
);
const photoCount = computed(
  () => photos.value.filter((photo) => photo.categoryIds.includes(props.category.id)).length,
);
watch(
  () => props.category.name,
  (value) => {
    name.value = value;
  },
);
function save() {
  error.value = '';
  message.value = '';
  try {
    renameCategory(props.category.id, name.value);
    message.value = 'Название обновлено в прайсе и галерее.';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось сохранить.';
  }
}
function remove() {
  error.value = '';
  try {
    removeCategory(props.category.id, destination.value || undefined);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось удалить.';
  }
}
</script>

<style scoped>
.category-editor-row__name-field {
  min-width: 9rem;
}
</style>
