<template>
  <section class="location-card" aria-labelledby="location-title">
    <div>
      <h3 id="location-title" class="location-card__title">Как добраться</h3>
      <address class="location-card__address">
        <span>{{ location.country }}, {{ location.city }}</span>
        <strong>{{ location.street }}</strong>
      </address>
      <p class="location-card__note">
        Покажем дорогу в фотографиях: от подъезда к участку до входа в баню.
      </p>
    </div>
    <div class="location-card__actions">
      <button type="button" class="btn btn-primary section-button" @click="routeOpen = true">
        Как доехать — по фото
      </button>
      <a
        :href="location.mapHref"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-primary section-button"
        >Открыть в Яндексе</a
      >
    </div>
    <MediaDialog
      :open="routeOpen"
      title="Как доехать"
      class="route-dialog"
      @close="routeOpen = false"
    >
      <p class="route-dialog__note">
        Макет фотомаршрута: фото и адрес тестовые. Реальные ориентиры добавим позже; пока уточните
        дорогу по телефону.
      </p>
      <div class="route-collage">
        <figure v-for="(step, index) in routeSteps" :key="step.title" class="route-step">
          <div class="route-step__photo">
            <img :src="step.image" :alt="step.alt" loading="lazy" />
            <span class="route-step__number" aria-hidden="true">{{ index + 1 }}</span>
          </div>
          <figcaption>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </figcaption>
        </figure>
      </div>
      <a
        :href="location.mapHref"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-primary section-button route-dialog__map"
        >Открыть в Яндексе</a
      >
    </MediaDialog>
  </section>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { practiceLocation as location } from '../../../entities/specialist/index.ts';
import { MediaDialog } from '../../../shared/ui/index.ts';
const routeOpen = ref(false);
// Replace these demo images and captions with Victoria's actual approach landmarks.
const routeSteps = [
  {
    title: 'Подъезд к участку',
    image: './images/bathhouse/pexels-13286779.jpg',
    alt: 'Тестовое фото участка с баней',
    description: 'Здесь будет фото поворота с улицы и ориентир, по которому легко узнать участок.',
  },
  {
    title: 'Место встречи',
    image: './images/bathhouse/pexels-15857059.jpg',
    alt: 'Тестовое фото террасы у бани',
    description: 'Добавим фото ворот и покажем, где оставить машину перед входом.',
  },
  {
    title: 'Вход в баню',
    image: './images/bathhouse/pexels-8092430.jpg',
    alt: 'Тестовое фото парной',
    description: 'На реальном снимке отметим дорожку от ворот и нужную дверь.',
  },
];
</script>
<style scoped>
.location-card {
  margin-top: 28px;
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 28px;
  align-items: center;
}
.location-card__title {
  margin: 0 0 20px;
  font: 400 32px var(--display);
}
.location-card__address {
  display: grid;
  gap: 8px;
  font-style: normal;
}
.location-card__address span,
.location-card__note {
  color: var(--muted);
  font-size: 16px;
  line-height: 1.7;
}
.location-card__address strong {
  font-size: 23px;
  font-weight: 500;
}
.location-card__note {
  max-width: 480px;
  margin: 16px 0 0;
}
.location-card__actions {
  display: grid;
  justify-items: stretch;
  width: 240px;
  max-width: 100%;
  gap: 12px;
}
.location-card__actions .btn {
  min-height: 54px;
}
.route-dialog__note {
  color: var(--muted);
  font-size: 16px;
  line-height: 1.7;
  max-width: 720px;
  margin-bottom: 24px;
}
.route-collage {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.route-step {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface-soft);
}
.route-step:first-child {
  grid-column: 1 / -1;
}
.route-step__photo {
  position: relative;
}
.route-step img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}
.route-step:first-child img {
  aspect-ratio: 21 / 9;
}
.route-step__number {
  position: absolute;
  left: 16px;
  top: 16px;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #2f2a25e8;
  color: #fff;
  border: 1px solid #ffffff60;
}
.route-step figcaption {
  padding: 20px;
}
.route-step h3 {
  font-size: 22px;
  margin: 0 0 8px;
  font-weight: 500;
}
.route-step p {
  color: var(--muted);
  font-size: 16px;
  line-height: 1.65;
  margin: 0;
}
.route-dialog__map {
  margin-top: 24px;
}
@media (max-width: 767.98px) {
  .location-card {
    grid-template-columns: 1fr;
    padding: 24px;
  }
}
@media (max-width: 575.98px) {
  .route-collage {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .route-step:first-child img {
    aspect-ratio: 16 / 10;
  }
  .route-dialog__map {
    width: fit-content;
    max-width: 100%;
  }
}
</style>
