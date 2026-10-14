<template>
  <div class="services-page position-relative">
    <ScrollAtmosphere />
    <section id="home" class="hero" tabindex="-1" aria-labelledby="home-title">
      <div class="container hero__layout">
        <div class="hero__heading">
          <h1 id="home-title" class="hero__title fw-normal">
            Баня у Виктории.<br /><em class="hero__accent">Время выдохнуть.</em>
          </h1>
        </div>
        <div class="hero__visual"><HeroVisual :image="siteImages.hero" /></div>
        <div class="hero__copy">
          <p class="hero__description">
            Тёплая парная и спокойный отдых в Солигорске. Выберите подходящий вариант отдыха в
            прайсе и посмотрите свободные даты.
          </p>
          <div id="hero-contact" class="hero__actions d-flex flex-wrap align-items-center gap-3">
            <SectionLink to="availability" class="btn btn-primary section-button hero__action">
              Выбрать отдых <ActionArrow />
            </SectionLink>
          </div>
        </div>
      </div>
    </section>
    <div class="section-reveal"><WorkGallery /></div>
    <div id="availability" class="section-reveal" tabindex="-1">
      <PriceList @choose="chooseRental" />
    </div>
    <MediaDialog
      :open="calendarOpen"
      :title="calendarTitle"
      class="rental-sheet"
      @close="calendarOpen = false"
    >
      <PublicAvailability @selection-details="contactDetails = $event" />
    </MediaDialog>
    <div class="section-reveal"><FirstVisit /></div>
    <div class="section-reveal"><ContactSection /></div>
    <MobileContactBar :service-name="contactDetails" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PriceList } from '../../../widgets/price-list/index.ts';
import { WorkGallery } from '../../../widgets/work-gallery/index.ts';
import { ContactSection } from '../../../widgets/contacts/index.ts';
import { FirstVisit } from '../../../widgets/first-visit/index.ts';
import { PublicAvailability } from '../../../widgets/public-availability/index.ts';
import HeroVisual from './HeroVisual.vue';
import { MobileContactBar } from '../../../features/contact-specialist/index.ts';
import { SectionLink, ActionArrow, MediaDialog } from '../../../shared/ui/index.ts';
import { usePractice } from '../../../entities/practice/index.ts';
import ScrollAtmosphere from './ScrollAtmosphere.vue';
import { useReveal } from '../../../shared/lib/reveal/index.ts';
useReveal();
const contactDetails = ref('');
const { siteImages, services, selectService } = usePractice();
const calendarOpen = ref(false);
const calendarTitle = ref('Выберите даты');
function chooseRental(id: number) {
  const service = services.value.find((item) => item.id === id);
  if (!service) return;
  selectService(service);
  calendarTitle.value = service.name;
  calendarOpen.value = true;
}
</script>

<style scoped>
.services-page .rental-sheet {
  inset: 0;
  margin: 0 auto;
  width: min(1120px, 100%);
  height: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
}
.rental-sheet[open] {
  animation: rental-rise 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes rental-rise {
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rental-sheet[open] {
    animation: none;
  }
}

.services-page {
  isolation: isolate;
  color: var(--ink);
  background: transparent;
}
.section-reveal {
  position: relative;
  z-index: 1;
  transition:
    opacity 0.7s ease,
    transform 0.7s ease;
}
.section-reveal--pending {
  opacity: 0;
  transform: translateY(24px);
}
.hero {
  position: relative;
  z-index: 1;
  overflow: clip;
  background: linear-gradient(90deg, #100a1b4d, transparent 78%);
}
.hero__layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  grid-template-areas: 'heading visual' 'copy visual';
  align-items: center;
  column-gap: 64px;
  padding-block: 56px 48px;
}
.hero__heading {
  grid-area: heading;
  align-self: end;
}
.hero__kicker {
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.7;
  letter-spacing: 0.1em;
  color: var(--brand);
}
.hero__title {
  font-family: var(--display);
  font-size: clamp(44px, 4.5vw, 68px);
  line-height: 1.16;
  letter-spacing: -0.045em;
  margin: 0 0 26px;
  color: var(--ink);
  text-shadow: 0 3px 24px #100a1b60;
}
.hero__accent {
  color: var(--accent);
  text-shadow: 0 0 38px #eb55bf33;
}
.hero__visual {
  grid-area: visual;
  min-width: 0;
}
.hero__copy {
  grid-area: copy;
  align-self: start;
}
.hero__description {
  max-width: 490px;
  font-size: 17px;
  line-height: 1.85;
  color: var(--muted);
  margin: 0 0 28px;
}
.hero__action {
  min-height: 56px;
  box-shadow: 0 10px 36px -14px #db55bf80;
}
.hero__formats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}
.hero__format {
  flex: 1 1 200px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: linear-gradient(135deg, #321c45d9, #21132fe6);
  text-align: left;
  color: var(--ink);
  box-shadow: inset 0 1px 0 #e4bcff0d;
  transition:
    border-color 160ms,
    background 160ms,
    box-shadow 160ms;
}
.hero__format:hover,
.hero__format:focus-visible {
  border-color: var(--accent);
  background: #3a2050;
  box-shadow: 0 0 24px -10px #d975ec66;
}
.hero__format:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 4px;
}
.hero__format > span {
  display: block;
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 7px;
  color: var(--muted);
}
.hero__format strong {
  font-size: 19px;
  line-height: 1.6;
  font-weight: 500;
}
.hero__format small {
  font-size: 14px;
  font-weight: 400;
}
.hero__tariff-note {
  margin: 0 0 22px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}
.hero__contact {
  background: none;
  border: 0;
  padding: 12px 0;
  font-size: 16px;
  color: var(--brand);
  text-decoration: underline;
  text-underline-offset: 5px;
}
.hero__hint {
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
  margin: 14px 0 25px;
}
.hero__address {
  display: inline-block;
  font-size: 16px;
  color: var(--brand);
  text-underline-offset: 5px;
  text-decoration-color: var(--line);
  line-height: 1.6;
}
@media (max-width: 991.98px) {
  .hero__layout {
    column-gap: 32px;
    padding-block: 48px;
  }
  .hero__title {
    font-size: clamp(35px, 4.6vw, 46px);
  }
  .hero__description {
    font-size: 16px;
  }
  .hero__kicker {
    font-size: 14px;
  }
}
@media (max-width: 767.98px) {
  .services-page {
    padding-bottom: calc(76px + env(safe-area-inset-bottom));
  }
  .hero__layout {
    column-gap: 26px;
    padding-block: 32px 40px;
  }
}
@media (max-width: 575.98px) {
  .hero__layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'heading' 'visual' 'copy';
    gap: 26px;
    padding-block: 32px;
  }
  .hero__kicker {
    margin-bottom: 16px;
  }
  .hero__title {
    font-size: clamp(35px, 9.1vw, 47px);
    margin: 0;
  }
  .hero__description {
    font-size: 16px;
    line-height: 1.75;
    margin-bottom: 20px;
  }
  .hero__action {
    width: 100%;
  }
  .hero__actions {
    justify-content: center;
  }
  .hero__hint {
    font-size: 14px;
    margin: 10px 0 20px;
    text-align: center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .section-reveal,
  .hero__format {
    transition: none;
  }
  .section-reveal--pending {
    opacity: 1;
    transform: none;
  }
}
@media (max-width: 575.98px) {
  .services-page .rental-sheet {
    width: 100%;
    max-width: 100%;
  }
  .rental-sheet :deep(.media-dialog__content) {
    padding: 12px 8px;
  }
}
</style>
