<template>
  <section class="availability-summary" aria-label="Расчёт стоимости">
    <p class="availability-summary__label">Предварительная стоимость</p>
    <strong class="availability-summary__total" aria-live="polite" aria-atomic="true">
      {{ price === null ? 'Проверьте параметры' : money(price) }}
    </strong>
    <p v-if="price !== null && rate !== undefined" class="availability-summary__formula">
      {{ money(rate) }} × {{ guests }} чел. × {{ quantity }} {{ daily ? 'сут.' : 'ч.' }}
    </p>
    <p v-else class="availability-summary__formula">Укажите гостей и длительность аренды.</p>
    <ContactLink class="btn btn-primary section-button" :service-name="details"
      >Связаться</ContactLink
    >
    <p class="availability-summary__note">Стоимость подтвердим при обращении.</p>
  </section>
</template>

<script setup lang="ts">
import { ContactLink } from '../../../features/contact-specialist/index.ts';
import { money } from '../../../shared/lib/format/index.ts';

defineProps<{
  price: number | null;
  rate?: number;
  quantity: number;
  guests: number;
  daily: boolean;
  details: string;
}>();
</script>

<style scoped>
.availability-summary {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 18px 14px;
  border: 1px solid #b3926e;
  border-radius: 20px;
  background: linear-gradient(135deg, #503a29, #382a20);
  text-align: center;
}
.availability-summary p {
  margin: 0;
}
.availability-summary__label,
.availability-summary__note {
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted);
}
.availability-summary__total {
  font-size: 26px;
  line-height: 1.2;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.availability-summary__formula {
  font-size: 13px;
  line-height: 1.5;
  color: var(--brand);
}
.availability-summary .section-button {
  max-width: 100%;
  margin-block: 4px;
}
@media (max-height: 680px) {
  .availability-summary {
    gap: 6px;
    margin-top: 12px;
    padding-block: 12px;
  }
  .availability-summary .section-button {
    min-height: 44px;
    padding-block: 10px;
    margin-block: 0;
  }
}
</style>
