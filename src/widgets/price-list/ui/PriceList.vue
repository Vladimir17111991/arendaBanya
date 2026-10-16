<template>
  <section
    id="price-list"
    class="content-section price-list container"
    tabindex="-1"
    aria-labelledby="price-title"
  >
    <div class="section-heading row gy-3">
      <div class="col-12">
        <h2 id="price-title" class="section-heading__title">
          Отдых <em class="section-heading__accent">в вашем ритме.</em>
        </h2>
      </div>
      <div class="col-12">
        <p class="section-heading__intro">
          Выберите свой вариант отдыха — стоимость рассчитывается за каждого гостя.
        </p>
      </div>
    </div>

    <div v-if="!services.length" class="price-list__empty">
      <h3 class="price-list__empty-title">Условия аренды обновляются</h3>
      <p>Уточните доступные варианты отдыха и свободные даты по телефону.</p>
      <ContactLink class="price-list__contact">Связаться</ContactLink>
    </div>

    <TransitionGroup v-else name="rental-card" tag="div" class="price-list__cards">
      <article v-for="service in services" :key="service.id" class="price-list__card">
        <header class="price-list__card-heading">
          <div class="price-list__meta">
            <span class="price-list__category">{{ service.category }}</span>
          </div>
          <h3 class="price-list__service-title">{{ service.name }}</h3>
          <p v-if="service.description" class="price-list__description">
            {{ service.description }}
          </p>
        </header>

        <div class="price-list__tariff">
          <p
            class="price-list__amount"
            :class="{ 'price-list__amount--on-request': !service.price }"
          >
            {{ money(service.price) }}
          </p>
          <p v-if="service.price > 0" class="price-list__unit">
            за одного гостя / {{ service.rentalUnit === 'day' ? 'сутки' : 'час' }}
          </p>
          <p v-else class="price-list__unit">Уточните стоимость по телефону</p>
        </div>

        <div class="price-list__information">
          <section v-if="service.details?.includes" class="price-list__includes">
            <h4 class="price-list__detail-label">Что входит</h4>
            <p class="price-list__detail-text">{{ service.details.includes }}</p>
          </section>
          <details
            v-if="service.details && (service.details.forWhom || service.details.preparation)"
            class="price-list__details"
          >
            <summary class="price-list__details-toggle">
              Подробнее об аренде
              <span class="price-list__details-icon" aria-hidden="true">＋</span>
            </summary>
            <dl class="price-list__detail-list">
              <template v-for="field in detailFields" :key="field.key">
                <dt v-if="service.details[field.key]" class="price-list__detail-label">
                  {{ field.label }}
                </dt>
                <dd v-if="service.details[field.key]" class="price-list__detail-text">
                  {{ service.details[field.key] }}
                </dd>
              </template>
            </dl>
          </details>
        </div>

        <div class="price-list__actions">
          <button
            type="button"
            class="btn btn-primary price-list__choose"
            :aria-label="'Посмотреть даты: ' + service.name"
            @click="emit('choose', service.id)"
          >
            Посмотреть даты
          </button>
        </div>
      </article>
    </TransitionGroup>
  </section>
</template>

<script setup lang="ts">
import { usePractice } from '../../../entities/practice/index.ts';
import { money } from '../../../shared/lib/format/index.ts';
import { ContactLink } from '../../../features/contact-specialist/index.ts';

const emit = defineEmits<{ choose: [serviceId: number] }>();
const { services } = usePractice();
const detailFields = [
  { key: 'forWhom', label: 'Для какого отдыха' },
  { key: 'preparation', label: 'Перед приездом' },
] as const;
</script>

<style scoped>
.price-list__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}
.price-list__card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(24px, 3vw, 38px);
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--surface);
  box-shadow:
    0 16px 34px -22px #14110fcc,
    inset 0 1px 0 #efebe70d;
}
.price-list__card-heading {
  min-height: 200px;
}
.price-list__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.price-list__category {
  padding: 6px 11px;
  border-radius: 8px;
  background: var(--control-bg);
  color: var(--brand);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.price-list__service-title {
  margin: 0;
  color: var(--ink);
  font-family: var(--display);
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
}
.price-list__description {
  margin: 14px 0 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.price-list__tariff {
  margin: 26px 0;
  padding-bottom: 25px;
  border-bottom: 1px solid var(--line);
}
.price-list__amount {
  margin: 0;
  color: var(--brand);
  font-family: var(--display);
  font-size: clamp(38px, 4vw, 54px);
  line-height: 1.1;
  letter-spacing: -0.035em;
  overflow-wrap: anywhere;
}
.price-list__amount--on-request {
  font-size: clamp(27px, 3vw, 37px);
}
.price-list__unit {
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.6;
}
.price-list__information {
  flex: 1;
  min-width: 0;
}
.price-list__detail-label {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}
.price-list__detail-text {
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.75;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.price-list__details {
  margin-top: 13px;
}
.price-list__details-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 8px 0;
  color: var(--brand);
  font-size: 16px;
  line-height: 1.5;
  list-style: none;
  cursor: pointer;
}
.price-list__details-toggle::-webkit-details-marker {
  display: none;
}
.price-list__details-icon {
  flex-shrink: 0;
  font-size: 18px;
  transition: transform 180ms ease;
}
.price-list__details[open] .price-list__details-icon {
  transform: rotate(45deg);
}
.price-list__detail-list {
  margin: 4px 0 0;
}
.price-list__detail-list .price-list__detail-label {
  margin-top: 16px;
}
.price-list__actions {
  display: grid;
  justify-items: start;
  gap: 8px;
  margin-top: 28px;
}
.price-list__choose {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 50px;
  width: fit-content;
  max-width: 100%;
  padding: 14px 20px;
  font-size: 17px;
}
.price-list__contact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: var(--brand);
  font-size: 16px;
  line-height: 1.5;
  text-align: center;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.price-list__contact:hover {
  color: var(--ink);
}
.price-list__footnote {
  margin: 23px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
  text-align: center;
}
.price-list__empty {
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface);
  color: var(--muted);
  font-size: 16px;
  line-height: 1.8;
}
.price-list__empty-title {
  margin: 0 0 12px;
  color: var(--ink);
  font-family: var(--display);
  font-size: 28px;
}
.rental-card-enter-active,
.rental-card-leave-active {
  transition: opacity 180ms ease;
}
.rental-card-enter-from,
.rental-card-leave-to {
  opacity: 0;
}
@media (max-width: 767.98px) {
  .price-list__cards {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
  .price-list__card {
    padding: 24px;
    border-radius: 22px;
  }
  .price-list__card-heading {
    min-height: 0;
  }
  .price-list__tariff {
    margin: 23px 0;
    padding-bottom: 23px;
  }
  .price-list__service-title {
    font-size: 30px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .price-list__details-icon,
  .rental-card-enter-active,
  .rental-card-leave-active {
    transition: none;
  }
}
.section-heading__intro {
  max-width: 720px;
  margin: 0;
}
</style>
