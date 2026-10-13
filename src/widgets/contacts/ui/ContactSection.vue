<template>
  <section
    id="contacts"
    class="contact-section content-section"
    tabindex="-1"
    aria-labelledby="contacts-title"
  >
    <div class="container">
      <div class="row align-items-center gy-3">
        <div class="col-lg-6">
          <h2 id="contacts-title" class="contact-section__title">
            До встречи <em class="contact-section__accent">у Виктории.</em>
          </h2>
          <p class="contact-section__intro">
            Позвоните Виктории, чтобы договориться об отдыхе: на несколько часов или на сутки со
            спальней.
          </p>
        </div>
        <div class="col-lg-5 offset-lg-1">
          <ContactLink class="btn section-button contact-section__instagram w-100"
            >Позвонить Виктории <ActionArrow
          /></ContactLink>
          <p class="contact-section__handle">{{ phone.label }}</p>
          <p v-if="phone.isDemo" class="contact-section__demo-note">
            Тестовый номер · настоящий телефон будет добавлен позже.
          </p>
        </div>
      </div>
      <LocationCard />
    </div>
  </section>
</template>

<script setup lang="ts">
import { phone } from '../../../entities/specialist/index.ts';
import { ContactLink } from '../../../features/contact-specialist/index.ts';
import { ActionArrow } from '../../../shared/ui/index.ts';
import LocationCard from './LocationCard.vue';
</script>

<style scoped>
.contact-section {
  border-top: 1px solid var(--line);
  background: radial-gradient(ellipse at 0 100%, #eb55bf1a, transparent 60%), #160d2399;
  color: var(--ink);
}
.contact-section__title {
  font-family: var(--display);
  font-size: clamp(34px, 3.7vw, 50px);
  line-height: 1.22;
  font-weight: 400;
  letter-spacing: -0.035em;
  margin-bottom: 16px;
}
.contact-section__accent {
  color: var(--accent);
}
.contact-section__intro {
  color: var(--muted);
  font-size: 18px;
  line-height: 1.75;
  max-width: 450px;
  margin-bottom: 0;
}
.contact-section__instagram {
  --bs-btn-color: var(--selected-text);
  --bs-btn-bg: var(--selected-bg);
  --bs-btn-border-color: var(--neon);
  --bs-btn-hover-bg: #9346cd;
  --bs-btn-hover-color: var(--selected-text);
  --bs-btn-hover-border-color: var(--accent);
  --bs-btn-active-bg: #6a29a3;
  --bs-btn-active-color: var(--selected-text);
  --action-arrow-bg: #ff95d426;
  min-height: 60px;
  font-size: 18px;
  box-shadow:
    0 8px 30px #eb55bf29,
    inset 0 1px 0 #ff95d433;
}
.contact-section__handle {
  font-size: 18px;
  text-align: center;
  margin: 12px 0 0;
  overflow-wrap: anywhere;
  color: var(--brand);
}
.contact-section__demo-note {
  font-size: 14px;
  text-align: center;
  color: var(--muted);
  margin: 6px 0 0;
  line-height: 1.6;
}
</style>
