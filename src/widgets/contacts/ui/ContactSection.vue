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
            До встречи <em class="contact-section__accent">в бане.</em>
          </h2>
          <p class="contact-section__intro">
            Выберите удобный способ связи или оставьте вопрос — обсудим даты и детали отдыха.
          </p>
        </div>
      </div>
      <div class="contact-section__form">
        <h3>Связаться с нами</h3>
        <ContactForm />
      </div>
      <LocationCard />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ContactForm } from '../../../features/contact-specialist/index.ts';
import LocationCard from './LocationCard.vue';
</script>

<style scoped>
.contact-section__form {
  margin-top: 32px;
  padding: clamp(20px, 3vw, 32px);
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface-raised);
}
.contact-section__form h3 {
  font-family: var(--display);
  font-size: 32px;
  margin: 0 0 20px;
}

.contact-section__phone-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.contact-section {
  border-top: 1px solid var(--line);
  background: radial-gradient(ellipse at 0 100%, #b98b591a, transparent 60%), #2b201999;
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
  --bs-btn-hover-bg: #ad8a66;
  --bs-btn-hover-color: var(--selected-text);
  --bs-btn-hover-border-color: var(--accent);
  --bs-btn-active-bg: #856647;
  --bs-btn-active-color: var(--selected-text);
  --action-arrow-bg: #deb98926;
  min-height: 60px;
  font-size: 18px;
  box-shadow:
    0 8px 30px #b98b5929,
    inset 0 1px 0 #deb98933;
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
