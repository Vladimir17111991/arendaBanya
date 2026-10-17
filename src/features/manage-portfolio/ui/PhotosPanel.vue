<template>
  <div class="photos-panel row gy-4 align-items-start">
    <div class="col-lg-5">
      <section v-if="!categories.length" class="card p-4">
        <h2 class="display-subtitle">Добавьте категорию</h2>
        <p class="my-3 small text-body-secondary">Категории галереи берутся из прайса.</p>
        <BaseButton @click="emit('openPrice')">Открыть прайс</BaseButton>
      </section>
      <form v-else ref="form" class="card p-4" @submit.prevent="publish">
        <h2 class="display-subtitle">Добавить фото</h2>
        <fieldset class="photos-panel__categories mt-4">
          <legend class="form-label">Категории</legend>
          <div class="photos-panel__choices">
            <label v-for="category in categories" :key="category.id" class="photos-panel__choice">
              <input v-model="categoryIds" type="checkbox" :value="category.id" />
              <span>{{ galleryCategoryLabel(category) }}</span>
            </label>
          </div>
          <p class="small text-secondary mt-2 mb-0">Можно выбрать несколько категорий.</p>
        </fieldset>
        <label for="gallery-photo" class="form-label mt-4">Фотография или готовый коллаж</label>
        <input
          id="gallery-photo"
          type="file"
          accept="image/*"
          class="form-control"
          @change="upload.select"
        />
        <p class="small text-secondary mt-2">Снимок до 20 МБ отображается целиком.</p>
        <img
          v-if="upload.ready.value"
          :src="upload.url.value"
          alt="Предпросмотр фотографии"
          class="photos-panel__image mt-3"
        />
        <p v-if="error || upload.error.value" class="alert alert-warning mt-3" role="alert">
          {{ error || upload.error.value }}
        </p>
        <p v-if="message" class="small text-secondary mt-3" role="status">{{ message }}</p>
        <BaseButton
          type="submit"
          class="mt-4 w-100"
          :disabled="!upload.ready.value || !categoryIds.length"
          >Добавить в галерею</BaseButton
        >
        <p class="small text-secondary mt-3 mb-0">
          В демо фотографии сохраняются до обновления вкладки.
        </p>
      </form>
    </div>
    <section class="col-lg-7" aria-labelledby="manage-gallery-title">
      <h2 id="manage-gallery-title" class="display-subtitle mb-4">Галерея</h2>
      <p v-if="!photos.length" class="text-secondary">
        Добавьте фотографии — они появятся на сайте.
      </p>
      <section
        v-for="group in groups"
        :key="group.id"
        class="photos-panel__group"
        :aria-labelledby="'gallery-category-' + group.id"
      >
        <h3 :id="'gallery-category-' + group.id" class="photos-panel__group-title">
          {{ group.label }} <span>{{ group.photos.length }}</span>
        </h3>
        <div class="row g-3">
          <div v-for="(photo, index) in group.photos" :key="photo.id" class="col-md-6">
            <article class="card p-3 h-100 photos-panel__card">
              <img :src="photo.url" :alt="photo.title" class="photos-panel__image" loading="lazy" />
              <BaseButton
                variant="text"
                :aria-label="'Убрать фото ' + (index + 1) + ': ' + group.label"
                @click="removePhoto(photo.id)"
                >Убрать из галереи</BaseButton
              >
            </article>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  usePractice,
  galleryCategoryLabel,
  groupGalleryPhotos,
} from '../../../entities/practice/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
import { usePhotoUpload } from '../../../shared/lib/image-upload/index.ts';
const emit = defineEmits<{ openPrice: [] }>();
const { categories, photos, addPhoto, removePhoto } = usePractice();
const categoryIds = ref<number[]>(categories.value[0] ? [categories.value[0].id] : []);
const groups = computed(() =>
  groupGalleryPhotos(categories.value, photos.value).filter((group) => group.photos.length),
);
const upload = usePhotoUpload();
const error = ref('');
const message = ref('');
const form = ref<HTMLFormElement | null>(null);
watch(
  () => categories.value.map((item) => item.id),
  (ids) => {
    categoryIds.value = categoryIds.value.filter((id) => ids.includes(id));
  },
);
function publish() {
  error.value = '';
  message.value = '';
  if (!upload.ready.value) return;
  try {
    addPhoto({ categoryIds: [...categoryIds.value], url: upload.url.value });
    upload.take();
    const input = form.value?.querySelector<HTMLInputElement>('input[type="file"]');
    if (input) input.value = '';
    message.value = 'Фото добавлено в галерею.';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось добавить фото.';
  }
}
</script>

<style scoped>
.photos-panel__image {
  width: 100%;
  height: 260px;
  object-fit: contain;
  image-orientation: from-image;
  border-radius: 14px;
  background: var(--paper, #f5f2e9);
}
.photos-panel__categories {
  min-width: 0;
}
.photos-panel__categories legend {
  float: none;
  font-size: 16px;
}
.photos-panel__choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr));
  grid-auto-rows: 1fr;
  gap: 10px;
}
.photos-panel__choice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  max-width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.photos-panel__choice:has(input:checked) {
  background: var(--selected-bg);
  border-color: var(--accent);
}
.photos-panel__choice input {
  appearance: none;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin: 0;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  color: var(--ink);
  background: transparent;
  cursor: pointer;
}
.photos-panel__choice input:checked {
  background: radial-gradient(circle, currentColor 0 4px, transparent 4.5px);
}
.photos-panel__choice input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
@media (forced-colors: active) {
  .photos-panel__choice input:checked {
    background: Highlight;
    box-shadow: inset 0 0 0 4px Canvas;
    forced-color-adjust: none;
  }
}
.photos-panel__group + .photos-panel__group {
  margin-top: 32px;
}
.photos-panel__group-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 16px;
  font-size: 22px;
}
.photos-panel__group-title span {
  color: var(--muted);
  font: 14px var(--bs-body-font-family);
}
.photos-panel__card {
  gap: 16px;
}
</style>
