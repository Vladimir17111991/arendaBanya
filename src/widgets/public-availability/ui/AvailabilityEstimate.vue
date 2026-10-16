<template>
  <Transition name="estimate-rise">
    <section v-if="visible" class="estimate" aria-label="Расчёт стоимости">
      <button
        type="button"
        class="estimate__toggle"
        :aria-expanded="expanded"
        :aria-controls="bodyId"
        :aria-label="expanded ? 'Свернуть расчёт' : 'Развернуть расчёт'"
        @click="emit('toggle')"
      >
        <span class="estimate__total">
          <span>Предварительная стоимость</span>
          <strong aria-live="polite" aria-atomic="true">{{
            price === null ? 'Проверьте параметры' : money(price)
          }}</strong>
        </span>
        <span class="estimate__action">
          {{ expanded ? 'Свернуть' : 'Подробнее' }}
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
            :class="{ 'is-expanded': expanded }"
          >
            <path d="m6 15 6-6 6 6" />
          </svg>
        </span>
      </button>
      <div
        :id="bodyId"
        class="estimate__details"
        :class="{ 'is-expanded': expanded }"
        :inert="!expanded"
        :aria-hidden="!expanded"
      >
        <div class="estimate__clip">
          <div class="estimate__body">
            <p v-if="price !== null && rate !== undefined" class="estimate__formula">
              {{ money(rate) }} × {{ guests }} чел. × {{ quantity }} {{ daily ? 'сут.' : 'ч.' }}
            </p>
            <p v-else class="estimate__hint">Укажите количество гостей и длительность аренды.</p>
            <div v-if="start" class="estimate__dates">
              <div>
                <span>{{ daily ? 'Заезд' : 'Дата отдыха' }}</span
                ><strong>{{ shortDate(start) }}</strong>
              </div>
              <div v-if="daily">
                <span>Выезд</span><strong>{{ end ? shortDate(end) : 'Выберите дату' }}</strong>
              </div>
            </div>
            <p v-else class="estimate__hint">
              {{
                daily
                  ? 'Отметьте в календаре заезд и выезд.'
                  : 'Выберите дату, чтобы посмотреть свободное время.'
              }}
            </p>
            <button
              v-if="!daily && start && hasTimes"
              type="button"
              class="estimate__times"
              @click="emit('show-times')"
            >
              Посмотреть свободное время
            </button>
            <ContactLink
              class="btn btn-primary section-button estimate__contact"
              :service-name="details"
              >Связаться</ContactLink
            >
            <p class="estimate__note">Время и стоимость подтвердим при обращении.</p>
          </div>
        </div>
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { ContactLink } from '../../../features/contact-specialist/index.ts';
import { money, shortDate } from '../../../shared/lib/format/index.ts';

defineProps<{
  visible: boolean;
  expanded: boolean;
  price: number | null;
  rate?: number;
  quantity: number;
  guests: number;
  daily: boolean;
  start: string;
  end: string;
  hasTimes: boolean;
  details: string;
}>();
const emit = defineEmits<{ toggle: []; 'show-times': [] }>();
const bodyId = useId();
</script>

<style scoped>
.estimate {
  position: absolute;
  z-index: 3;
  inset-inline: 0;
  bottom: 0;
  width: min(520px, 100%);
  max-height: calc(100dvh - 110px);
  margin-inline: auto;
  overflow: hidden;
  border: 1px solid #b3926e;
  border-radius: 24px;
  color: var(--ink);
  background: var(--surface);
  box-shadow:
    0 -8px 40px #17100c40,
    0 18px 60px #100c09aa;
}
.estimate__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 84px;
  padding: 15px 22px;
  border: 0;
  background: linear-gradient(115deg, #503a29, #382a20);
  color: inherit;
  text-align: left;
}
.estimate__total {
  display: grid;
  gap: 3px;
}
.estimate__total > span {
  color: var(--muted);
  font-size: 12px;
}
.estimate__total strong {
  font-size: 24px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
}
.estimate__action {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
  font-size: 13px;
  white-space: nowrap;
}
.estimate__action svg {
  flex-shrink: 0;
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}
.estimate__action .is-expanded {
  transform: rotate(180deg);
}
.estimate__details {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 240ms ease;
}
.estimate__details.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
}
.estimate__clip {
  min-height: 0;
  overflow: hidden;
}
.estimate__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-height: min(350px, calc(100dvh - 200px));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 22px;
  border-top: 1px solid var(--line);
  text-align: center;
}
.estimate__formula {
  margin: 0;
  color: var(--brand);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.estimate__dates {
  display: flex;
  justify-content: center;
  gap: 40px;
}
.estimate__dates > div {
  display: grid;
  gap: 4px;
}
.estimate__dates span {
  font-size: 12px;
  color: var(--muted);
}
.estimate__dates strong {
  font-size: 16px;
}
.estimate__hint,
.estimate__note {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}
.estimate__times {
  min-height: 36px;
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.estimate__contact {
  flex-shrink: 0;
}
.estimate__toggle:focus-visible,
.estimate__times:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: -4px;
}
.estimate-rise-enter-active,
.estimate-rise-leave-active {
  transition:
    transform 240ms ease,
    opacity 240ms ease;
}
.estimate-rise-enter-from,
.estimate-rise-leave-to {
  transform: translateY(16px);
  opacity: 0;
}
@media (max-width: 991.98px) {
  .estimate__toggle {
    min-height: 76px;
    padding: 12px 14px;
    gap: 10px;
  }
  .estimate__total strong {
    font-size: 22px;
  }
}
@media (max-width: 359.98px) {
  .estimate__toggle {
    gap: 8px;
    padding: 12px;
  }
  .estimate__total > span {
    font-size: 11px;
  }
  .estimate__action {
    gap: 3px;
    font-size: 12px;
  }
  .estimate__body {
    padding: 18px 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .estimate-rise-enter-active,
  .estimate-rise-leave-active,
  .estimate__details,
  .estimate__action svg {
    transition: none;
  }
}
</style>
