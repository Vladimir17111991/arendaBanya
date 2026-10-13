<template>
  <header
    class="mx-auto d-flex flex-wrap align-items-center justify-content-between gap-4 border-bottom px-4 py-4 px-md-5 dikidi-site-header__header"
  >
    <a
      href="#victoria-home"
      class="d-flex align-items-center gap-3 fs-4 fw-semibold"
      aria-label="Виктория — на главную"
    >
      <span
        class="grid align-items-center justify-content-center rounded-pill border display-font fs-2 fw-normal dikidi-site-header__monogram"
        >О</span
      >
      <span
        >Виктория<small class="mt-1 d-block small dikidi-site-header__subtitle"
          >АРЕНДА БАНИ</small
        ></span
      >
    </a>
    <nav
      class="d-flex w-100 flex-wrap align-items-center gap-4 small gap-md-4 dikidi-site-header__navigation"
      aria-label="Навигация сайта Виктории"
    >
      <a href="#victoria-services" class="text-body-secondary dikidi-site-header__link"
        >Варианты аренды</a
      >
      <a href="#victoria-visit" class="text-body-secondary dikidi-site-header__link"
        >Первый визит</a
      >
      <BaseButton class="ms-auto py-3 ms-md-0" @click="$emit('book')"
        >Записаться онлайн <span aria-hidden="true" class="ms-2">↗</span></BaseButton
      >
    </nav>
  </header>
</template>

<script setup lang="ts">
import { BaseButton } from '../../../shared/ui/index.ts';
defineEmits<{ book: [] }>();
</script>

<style scoped>
.dikidi-site-header__header {
  max-width: 1240px;
}
.dikidi-site-header__monogram {
  width: 2.75rem;
  height: 2.75rem;
  border-color: #547778;
}
.dikidi-site-header__subtitle {
  letter-spacing: 0.3em;
}
@media (min-width: 768px) {
  .dikidi-site-header__navigation {
    width: auto;
  }
}
.dikidi-site-header__link:hover {
  color: var(--brand);
}
</style>
