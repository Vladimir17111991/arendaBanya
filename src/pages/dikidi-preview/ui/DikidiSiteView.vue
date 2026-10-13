<template>
  <div id="victoria-home">
    <DikidiSiteHeader @book="openBooking()" />
    <main class="mx-auto px-4 px-md-5 dikidi-site-view__container">
      <section class="grid align-items-center gap-5 py-5 dikidi-site-view__hero">
        <div>
          <p class="section-heading__kicker">ВАШЕ ВРЕМЯ ДЛЯ СЕБЯ</p>
          <h1 class="mb-4 display-font dikidi-site-view__title">
            Время для отдыха.<br /><em class="text-secondary">С вниманием к вам.</em>
          </h1>
          <p class="text-body-secondary dikidi-site-view__intro">
            Бережный уход начинается со знакомства.<br class="d-none d-md-block" />
            Выберите аренду, а удобное время найдётся онлайн.
          </p>
          <div class="mt-5 d-flex flex-wrap align-items-center gap-4">
            <BaseButton @click="openBooking()"
              >Выбрать время <span aria-hidden="true" class="ms-4">↗</span></BaseButton
            >
            <a
              href="#victoria-services"
              class="small text-decoration-underline link-offset-3 dikidi-site-view__link"
              >Посмотреть аренды</a
            >
          </div>
          <p class="mt-3 small text-body-secondary">
            Онлайн-запись через <span class="fw-semibold text-primary">DIKIDI</span>
          </p>
        </div>
        <aside class="position-relative bg-primary-subtle p-4 p-md-5 dikidi-site-view__preview">
          <div class="mb-4 d-flex align-items-center justify-content-between gap-3">
            <span class="small fw-semibold text-primary dikidi-site-view__eyebrow"
              >ПРИЁМ НАЧИНАЕТСЯ ЗДЕСЬ</span
            ><span class="small text-primary" aria-hidden="true">01 /</span>
          </div>
          <h2 class="display-font fs-2 lh-sm dikidi-site-view__preview-title">
            Найдите время<br />для себя.
          </h2>
          <div class="mt-4 rounded-4 bg-white p-4 dikidi-site-view__card">
            <div class="d-flex align-items-center gap-3">
              <span
                class="grid align-items-center justify-content-center rounded-pill border display-font fs-4 dikidi-site-view__avatar"
                >О</span
              >
              <div>
                <strong class="d-block small">Виктория</strong
                ><span class="small text-body-secondary">Баня</span>
              </div>
              <span class="ms-auto small fw-bold"
                >DIKIDI<span class="dikidi-site-view__accent">.</span></span
              >
            </div>
            <div class="mt-4 border-top pt-3">
              <p class="small text-body-secondary">Первый шаг к вашему уходу</p>
              <p class="mt-1 fw-semibold">Аренда → дата → время</p>
            </div>
            <BaseButton class="mt-4 w-100 py-3" @click="openBooking()"
              >Открыть онлайн-запись <span aria-hidden="true" class="ms-3">↗</span></BaseButton
            >
          </div>
          <p class="mt-3 small lh-base text-primary">
            Сейчас откроется демонстрация.<br />Аккаунт Виктории в DIKIDI ещё не подключён.
          </p>
        </aside>
      </section>
      <section id="victoria-services" class="border-top py-5 py-md-5 dikidi-site-view__section">
        <div class="mb-4 d-flex align-items-end justify-content-between gap-4">
          <div>
            <p class="section-heading__kicker mb-3">ЗНАКОМСТВО С УХОДОМ</p>
            <h2 class="display-subtitle fs-2">Варианты аренды</h2>
          </div>
          <p class="text-end small text-body-secondary dikidi-site-view__price-note">
            Демонстрационные аренды и цены
          </p>
        </div>
        <div class="grid gap-3 grid-cols-md-2 grid-cols-lg-4">
          <ServiceCard
            v-for="(service, index) in services"
            :key="service.id"
            :service="service"
            :index="index"
            can-book
            @select="openBooking"
          />
        </div>
      </section>
      <section
        id="victoria-visit"
        class="grid gap-4 border-top py-5 py-md-5 dikidi-site-view__contacts"
      >
        <div>
          <p class="section-heading__kicker">ЕСЛИ ВЫ ВПЕРВЫЕ</p>
          <h2 class="display-subtitle fs-2">
            Начнём<br /><em class="text-secondary">со знакомства.</em>
          </h2>
          <p class="mt-3 small text-body-secondary dikidi-site-view__contact-intro">
            На консультации обсудим ваш привычный уход и пожелания, затем определим дальнейшие шаги.
          </p>
          <BaseButton variant="text" class="mt-3 ps-0" @click="openBooking()"
            >Выбрать аренду ↗</BaseButton
          >
        </div>
        <div class="grid gap-4 grid-cols-md-3">
          <div class="border-top border-success-subtle pt-4">
            <span class="display-font fs-2 text-secondary">01</span>
            <h3 class="mt-3 mb-2 fw-semibold">Выберите аренду</h3>
            <p class="small text-body-secondary">Познакомьтесь с услугами и стоимостью на сайте.</p>
          </div>
          <div class="border-top border-success-subtle pt-4">
            <span class="display-font fs-2 text-secondary">02</span>
            <h3 class="mt-3 mb-2 fw-semibold">Найдите своё время</h3>
            <p class="small text-body-secondary">Откройте онлайн-запись и выберите день визита.</p>
          </div>
          <div class="border-top border-success-subtle pt-4">
            <span class="display-font fs-2 text-secondary">03</span>
            <h3 class="mt-3 mb-2 fw-semibold">Подтвердите визит</h3>
            <p class="small text-body-secondary">
              В подключённом DIKIDI запись попадёт в расписание Виктории.
            </p>
          </div>
        </div>
      </section>
    </main>
    <footer
      class="mx-4 d-flex flex-wrap align-items-center justify-content-between gap-3 border-top py-4 small text-body-secondary mx-md-5 mx-xl-auto dikidi-site-view__footer"
    >
      <span>Виктория · аренда бани</span><span>Концепция сайта с записью через DIKIDI</span>
    </footer>
    <DikidiBookingDialog v-model="bookingOpen" :service="selectedService" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePractice, type Service } from '../../../entities/practice/index.ts';

import { BaseButton } from '../../../shared/ui/index.ts';
import ServiceCard from './ServiceCard.vue';
import DikidiSiteHeader from './DikidiSiteHeader.vue';
import DikidiBookingDialog from './DikidiBookingDialog.vue';

const bookingOpen = ref(false);
const { services } = usePractice();
const selectedService = ref<Service | null>(null);
function openBooking(service: Service | null = null) {
  selectedService.value = service;
  bookingOpen.value = true;
}
</script>

<style scoped>
.dikidi-site-view__container {
  max-width: 1240px;
}
.dikidi-site-view__price-note {
  max-width: 9rem;
}
@media (min-width: 768px) {
  .dikidi-site-view__hero {
    padding-block: 4rem;
  }
  .dikidi-site-view__preview-title {
    font-size: 36px;
  }
  .dikidi-site-view__price-note {
    max-width: none;
  }
}
@media (min-width: 992px) {
  .dikidi-site-view__hero {
    grid-template-columns: 1.2fr 1fr;
    gap: 5rem;
  }
  .dikidi-site-view__contacts {
    grid-template-columns: 0.8fr 1.2fr;
    gap: 4rem;
  }
}
.dikidi-site-view__title {
  font-size: clamp(2.5rem, 4.4vw, 3.875rem);
  line-height: 1.15;
  letter-spacing: -0.025em;
}
.dikidi-site-view__intro {
  max-width: 440px;
}
.dikidi-site-view__link {
  text-decoration-color: #bacdc3;
}
.dikidi-site-view__preview {
  border-radius: 12px 64px 12px 12px;
}
.dikidi-site-view__eyebrow {
  letter-spacing: 0.17em;
}
.dikidi-site-view__preview-title {
  max-width: 17.5rem;
}
.dikidi-site-view__card {
  box-shadow: 0 12px 30px -20px #183e4260;
}
.dikidi-site-view__avatar {
  width: 2.5rem;
  height: 2.5rem;
}
.dikidi-site-view__accent {
  color: #e68751;
}
.dikidi-site-view__section {
  scroll-margin-top: 1.5rem;
}
.dikidi-site-view__contacts {
  scroll-margin-top: 1.5rem;
}
.dikidi-site-view__contact-intro {
  max-width: 20rem;
}
.dikidi-site-view__footer {
  max-width: 1160px;
}
</style>
