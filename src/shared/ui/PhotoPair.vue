<template>
  <div
    class="photo-pair"
    :class="{ 'photo-pair--expanded': expanded, 'photo-pair--single': !paired }"
  >
    <div v-if="paired" class="photo-pair__frame">
      <span class="photo-pair__label">До</span>
      <div class="photo-pair__image-wrap">
        <img
          :src="demoDiptych ? src : beforeSrc"
          :alt="title + ' — до'"
          class="photo-pair__image"
          :class="{ 'photo-pair__image--diptych': demoDiptych }"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
    <div class="photo-pair__frame">
      <span v-if="paired" class="photo-pair__label">После</span>
      <div class="photo-pair__image-wrap">
        <img
          :src="src"
          :alt="paired ? title + ' — после' : title"
          class="photo-pair__image"
          :class="{
            'photo-pair__image--diptych photo-pair__image--after': demoDiptych,
          }"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  src: string;
  beforeSrc?: string;
  title: string;
  demoDiptych?: boolean;
  expanded?: boolean;
}>();
const paired = computed(() => !!props.beforeSrc || props.demoDiptych);
</script>

<style scoped>
.photo-pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 6px;
  text-align: left;
}
.photo-pair--single {
  grid-template-columns: minmax(0, 1fr);
}
.photo-pair__frame {
  min-width: 0;
}
.photo-pair__label {
  display: block;
  padding: 4px 5px 8px;
  color: #664554;
  font-size: 12px;
  font-weight: 600;
}
.photo-pair__image-wrap {
  aspect-ratio: 3/4;
  overflow: hidden;
  border-radius: 12px;
  background: #eddfdf;
}
.photo-pair--single .photo-pair__image-wrap {
  aspect-ratio: auto;
}
.photo-pair__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-orientation: from-image;
}
.photo-pair--single .photo-pair__image {
  height: auto;
}
.photo-pair__image--diptych {
  width: 200%;
  max-width: none;
  object-fit: fill;
}
.photo-pair__image--after {
  transform: translateX(-50%);
}
@media (max-width: 767.98px) {
  .photo-pair--expanded {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
}
</style>
