<template>
  <div class="location-card row g-0 overflow-hidden" aria-labelledby="location-title">
    <div class="col-lg-4 location-card__copy">
      <h3 id="location-title" class="location-card__title">Как добраться</h3>
      <address class="location-card__address d-flex flex-column">
        <span class="location-card__city">{{ location.country }}, {{ location.city }}</span>
        <strong class="location-card__street fw-medium">{{ location.street }}</strong>
      </address>
      <p class="location-card__note">
        Тестовый адрес для макета. Перед поездкой уточните у Виктории точное место и детали заезда.
      </p>
      <a
        :href="location.routeHref"
        target="_blank"
        rel="noopener noreferrer"
        class="btn location-card__route"
        >Построить маршрут <span class="location-card__arrow" aria-hidden="true">↗</span></a
      >
      <a
        :href="location.mapHref"
        target="_blank"
        rel="noopener noreferrer"
        class="location-card__map-link d-block"
        >Открыть в Яндекс Картах</a
      >
    </div>
    <div class="col-lg-8 location-card__map">
      <iframe
        class="location-card__iframe d-block w-100 h-100"
        :src="location.embedHref"
        title="Тестовый адрес на Яндекс Картах: Солигорск, проспект Мира, 32Б"
        loading="lazy"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { practiceLocation as location } from '../../../entities/specialist/index.ts';
</script>

<style scoped>
.location-card {
  margin-top: 28px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface);
}
.location-card__copy {
  padding: 28px;
}
.location-card__title {
  margin: 0 0 23px;
  font-family: var(--display);
  font-size: 30px;
}
.location-card__address {
  gap: 10px;
  margin: 0 0 18px;
  font-style: normal;
}
.location-card__city {
  color: var(--muted);
  font-size: 16px;
}
.location-card__street {
  font-size: 22px;
}
.location-card__note {
  color: var(--muted);
  font-size: 16px;
  line-height: 1.7;
  margin-bottom: 24px;
}
.location-card__route {
  --bs-btn-color: var(--brand);
  --bs-btn-bg: var(--control-bg);
  --bs-btn-border-color: var(--line);
  --bs-btn-hover-color: var(--selected-text);
  --bs-btn-hover-bg: var(--selected-bg);
  --bs-btn-hover-border-color: var(--accent);
  --bs-btn-active-color: var(--selected-text);
  --bs-btn-active-bg: #6a29a3;
  min-height: 56px;
  font-size: 16px;
  padding: 13px 20px;
}
.location-card__arrow {
  margin-left: 12px;
}
.location-card__map-link {
  width: fit-content;
  padding: 12px 0;
  margin-top: 6px;
  color: var(--accent);
  font-size: 16px;
  text-underline-offset: 4px;
}
.location-card__map-link:hover {
  color: var(--ink);
}
.location-card__map {
  min-height: 300px;
  background: var(--surface-soft);
}
.location-card__iframe {
  min-height: 300px;
  border: 0;
}
@media (max-width: 767.98px) {
  .location-card__copy {
    padding: 26px 23px;
  }
  .location-card__map {
    min-height: 240px;
  }
  .location-card__iframe {
    min-height: 240px;
  }
}
</style>
