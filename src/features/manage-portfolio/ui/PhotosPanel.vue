<template>
  <div class="photos-panel row gy-4 align-items-start">
    <div class="col-lg-5">
      <section v-if="!services.length" class="card p-4">
        <h2 class="display-subtitle">Сначала добавьте вариант аренды</h2>
        <p class="my-3 small text-body-secondary">Фото можно связать с баней или проживанием.</p>
        <BaseButton @click="emit('openPrice')">Открыть варианты аренды</BaseButton>
      </section>
      <form v-else ref="form" class="card p-4" @submit.prevent="publish">
        <h2 class="display-subtitle">Добавить фото бани</h2>
        <label for="photo-service" class="form-label mt-4">Вариант аренды</label>
        <select id="photo-service" v-model="serviceId" class="form-select">
          <option v-for="service in services" :key="service.id" :value="service.id">
            {{ service.name }}
          </option>
        </select>
        <label for="gallery-photo" class="form-label mt-4">Фотография или готовый коллаж</label>
        <input
          id="gallery-photo"
          type="file"
          accept="image/*"
          class="form-control"
          @change="upload.select"
        />
        <p class="small text-secondary mt-2">
          Покажите парную, комнату отдыха, спальню или участок. Снимок до 20 МБ отображается
          целиком.
        </p>
        <img
          v-if="upload.ready.value"
          :src="upload.url.value"
          alt="Предпросмотр фотографии бани"
          class="photos-panel__image mt-3"
        />
        <label for="photo-title" class="form-label mt-3">Подпись к фото</label>
        <input
          id="photo-title"
          v-model="title"
          class="form-control"
          required
          maxlength="100"
          placeholder="Например, парная или спальня"
        />
        <label for="photo-note" class="form-label mt-3">Описание · необязательно</label>
        <input
          id="photo-note"
          v-model="description"
          class="form-control"
          maxlength="180"
          placeholder="Расскажите, что изображено на снимке"
        />
        <p v-if="error || upload.error.value" class="alert alert-warning mt-3" role="alert">
          {{ error || upload.error.value }}
        </p>
        <p v-if="message" class="small text-secondary mt-3" role="status">{{ message }}</p>
        <BaseButton type="submit" class="mt-4 w-100" :disabled="!upload.ready.value"
          >Добавить в галерею</BaseButton
        >
        <p class="small text-secondary mt-3 mb-0">
          В демо фотографии сохраняются до обновления вкладки.
        </p>
      </form>
    </div>
    <section class="col-lg-7">
      <h2 class="display-subtitle mb-4">Галерея бани</h2>
      <p v-if="!photos.length" class="text-secondary">
        Добавьте фото бани, спальни и участка — они появятся на сайте.
      </p>
      <div class="row g-3">
        <div v-for="photo in photos" :key="photo.id" class="col-md-6">
          <article class="card p-3 h-100">
            <img :src="photo.url" :alt="photo.title" class="photos-panel__image" loading="lazy" />
            <p v-if="photo.isDemo" class="small text-secondary mt-3 mb-1">
              Пример оформления · замените своим фото
            </p>
            <p class="small text-secondary mt-3 mb-1">
              {{ services.find((item) => item.id === photo.serviceId)?.name }}
            </p>
            <h3 class="fs-6">{{ photo.title }}</h3>
            <p v-if="photo.comparisonNote" class="small text-secondary">
              {{ photo.comparisonNote }}
            </p>
            <BaseButton
              variant="text"
              class="mt-auto"
              :aria-label="'Убрать фото: ' + photo.title"
              @click="removePhoto(photo.id)"
              >Убрать из галереи</BaseButton
            >
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePractice } from '../../../entities/practice/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
import { usePhotoUpload } from '../../../shared/lib/image-upload/index.ts';
const emit = defineEmits<{ openPrice: [] }>();
const { services, photos, addPhoto, removePhoto } = usePractice();
const serviceId = ref(services.value[0]?.id ?? 0);
const upload = usePhotoUpload();
const title = ref('');
const description = ref('');
const error = ref('');
const message = ref('');
const form = ref<HTMLFormElement | null>(null);
watch(
  () => services.value.map((item) => item.id),
  (ids) => {
    if (!ids.includes(serviceId.value)) serviceId.value = ids[0] ?? 0;
  },
);
function publish() {
  error.value = '';
  message.value = '';
  if (!upload.ready.value) return;
  try {
    addPhoto({
      serviceId: serviceId.value,
      title: title.value,
      url: upload.url.value,
      comparisonNote: description.value,
    });
    upload.take();
    title.value = '';
    description.value = '';
    const input = form.value?.querySelector<HTMLInputElement>('input[type="file"]');
    if (input) input.value = '';
    message.value = 'Фото добавлено в галерею бани на сайте.';
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
</style>
