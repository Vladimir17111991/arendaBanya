<template>
  <form class="site-image-editor card p-3 p-lg-4" @submit.prevent="save">
    <h3 class="fs-5 mb-2">{{ title }}</h3>
    <p class="text-secondary small mb-3">{{ description }}</p>
    <img
      v-if="previewUrl"
      :src="previewUrl"
      :alt="'Предпросмотр: ' + title"
      class="site-image-editor__preview mb-3"
    />
    <p v-else class="site-image-editor__empty rounded-3 p-4 text-center mb-3">
      Фото пока нет. На сайте этот снимок скрыт.
    </p>
    <p v-if="upload.ready.value" class="small text-secondary">
      Предпросмотр нового снимка. Нажмите «Сохранить фото», чтобы опубликовать его на сайте.
    </p>
    <p v-else-if="current?.isDemo" class="small text-secondary">Сейчас показано тестовое фото.</p>
    <label :for="inputId" class="form-label">{{
      current ? 'Заменить фото' : 'Добавить фото'
    }}</label>
    <input :id="inputId" class="form-control" type="file" accept="image/*" @change="select" />
    <p class="small text-secondary mt-2">Из галереи телефона или с компьютера · до 20 МБ.</p>
    <div class="d-flex flex-wrap gap-2 mt-2">
      <BaseButton type="submit" :disabled="!upload.ready.value">Сохранить фото</BaseButton>
      <BaseButton v-if="upload.url.value" variant="text" @click="cancel">Отменить выбор</BaseButton>
      <BaseButton v-if="current" variant="danger" :aria-label="'Удалить: ' + title" @click="remove"
        >Удалить фото</BaseButton
      >
    </div>
    <p v-if="error || upload.error.value" class="alert alert-warning mt-3 mb-0" role="alert">
      {{ error || upload.error.value }}
    </p>
    <p v-if="message" class="small text-secondary mt-3 mb-0" role="status">{{ message }}</p>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { usePractice, type SiteImageSlot } from '../../../entities/practice/index.ts';
import { usePhotoUpload } from '../../../shared/lib/image-upload/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
const props = defineProps<{ slotName: SiteImageSlot; title: string; description: string }>();
const { siteImages, setSiteImage, removeSiteImage } = usePractice();
const current = computed(() => siteImages.value[props.slotName]);
const upload = usePhotoUpload();
const previewUrl = computed(() => (upload.ready.value ? upload.url.value : current.value?.url));
const inputId = useId();
const error = ref('');
const message = ref('');
function select(event: Event) {
  message.value = '';
  error.value = '';
  upload.select(event);
}
function cancel() {
  upload.release();
  upload.error.value = '';
  error.value = '';
  message.value = '';
}
function save() {
  if (!upload.ready.value || !upload.dimensions.value) return;
  try {
    setSiteImage(props.slotName, { url: upload.url.value, ...upload.dimensions.value });
    upload.take();
    message.value = 'Фото обновлено на сайте.';
    error.value = '';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось сохранить фото.';
  }
}
function remove() {
  try {
    removeSiteImage(props.slotName);
    cancel();
    message.value = 'Фото удалено с сайта. Можно добавить другое.';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось удалить фото.';
  }
}
</script>

<style scoped>
.site-image-editor {
  min-width: 0;
}
.site-image-editor__preview {
  display: block;
  width: 100%;
  height: 280px;
  object-fit: contain;
  image-orientation: from-image;
  background: #f1efdf;
  border-radius: 14px;
}
.site-image-editor__empty {
  color: var(--muted);
  background: #f1efdf;
}
</style>
