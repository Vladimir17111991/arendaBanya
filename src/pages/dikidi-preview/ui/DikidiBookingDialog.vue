<template>
  <dialog
    ref="dialog"
    class="position-fixed top-0 bottom-0 start-0 end-0 m-auto overflow-y-auto rounded-4 bg-white p-0 shadow dikidi-booking-dialog__dialog"
    aria-labelledby="dikidi-title"
    aria-describedby="dikidi-demo-note"
    @cancel.prevent="close"
    @close="close"
    @click="onBackdrop"
  >
    <div
      class="position-sticky top-0 d-flex align-items-center justify-content-between border-bottom border-secondary-subtle bg-white px-4 py-3 px-md-4 dikidi-booking-dialog__header"
    >
      <div class="d-flex align-items-center gap-3">
        <span class="fs-5 fw-bold dikidi-booking-dialog__brand"
          >DIKIDI<span class="dikidi-booking-dialog__brand-dot">.</span></span
        ><span class="border-start ps-3 small text-body-secondary">Пример окна записи</span>
      </div>
      <button
        type="button"
        class="grid align-items-center justify-content-center rounded-pill bg-light fs-5 dikidi-booking-dialog__close"
        aria-label="Закрыть пример записи"
        autofocus
        @click="close"
      >
        ×
      </button>
    </div>
    <div class="p-4 p-md-4">
      <p
        id="dikidi-demo-note"
        class="mb-4 rounded-3 bg-warning-subtle px-3 py-3 small lh-base text-warning-emphasis"
      >
        Это интерактивный макет, а не подключённый виджет DIKIDI. Цены и время примерные, запись не
        создаётся.
      </p>
      <div class="mb-4 d-flex align-items-center gap-3">
        <span
          class="grid align-items-center justify-content-center rounded-pill bg-primary-subtle display-font fs-4 text-primary dikidi-booking-dialog__avatar"
          >О</span
        >
        <div>
          <h2 id="dikidi-title" class="fs-5 fw-semibold">Виктория</h2>
          <p class="small text-body-secondary">Баня · онлайн-запись</p>
        </div>
      </div>
      <p v-if="!selected" class="py-4 text-body-secondary">
        В прайсе пока нет вариантов аренды. Виктория обновляет список.
      </p>
      <template v-else-if="stage === 'select'">
        <label for="dikidi-service" class="mb-2 d-block small fw-semibold">1. Аренда</label>
        <select id="dikidi-service" v-model="selectedId" class="small form-select">
          <option v-for="item in services" :key="item.id" :value="item.id">
            {{ item.name }} · {{ money(item.price) }} · {{ item.duration }} мин
          </option>
        </select>
        <fieldset class="mt-4 dikidi-booking-dialog__group">
          <legend class="mb-3 small fw-semibold fs-6">2. Дата</legend>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="day in dates"
              :key="day"
              type="button"
              class="rounded-3 border px-1 py-3"
              :class="
                date === day
                  ? 'text-white dikidi-booking-dialog__date--selected'
                  : 'border-secondary-subtle dikidi-booking-dialog__date'
              "
              :aria-label="fullDate(day)"
              :aria-pressed="date === day"
              @click="
                date = day;
                time = '';
              "
            >
              <span class="d-block small opacity-75">{{ dayName(day) }}</span
              ><strong class="mt-1 d-block small dikidi-booking-dialog__date-label">{{
                shortDate(day)
              }}</strong>
            </button>
          </div>
        </fieldset>
        <fieldset class="mt-4 dikidi-booking-dialog__group">
          <legend class="mb-3 small fw-semibold fs-6">3. Время</legend>
          <div class="grid grid-cols-3 gap-2 grid-cols-md-5">
            <button
              v-for="slot in slots"
              :key="slot"
              type="button"
              class="rounded-3 border py-2 small"
              :class="
                time === slot
                  ? 'bg-warning-subtle text-warning-emphasis dikidi-booking-dialog__time--selected'
                  : 'border-secondary-subtle dikidi-booking-dialog__time'
              "
              :aria-pressed="time === slot"
              @click="time = slot"
            >
              {{ slot }}
            </button>
          </div>
        </fieldset>
        <div
          class="mt-4 d-flex align-items-center justify-content-between gap-3 border-top border-secondary-subtle pt-4"
        >
          <div>
            <strong class="fs-5">{{ money(selected.price) }}</strong>
            <p class="small text-body-secondary">{{ selected.duration }} минут</p>
          </div>
          <button
            type="button"
            class="rounded-3 px-4 py-3 small fw-semibold text-white dikidi-booking-dialog__submit"
            :disabled="!time"
            @click="stage = 'handoff'"
          >
            Далее <span aria-hidden="true" class="ms-3">→</span>
          </button>
        </div>
      </template>
      <template v-else>
        <div class="rounded-4 border bg-light p-4">
          <p class="mb-2 small text-body-secondary">Вы выбрали в макете</p>
          <h3 class="fs-5 fw-semibold">{{ selected.name }}</h3>
          <p class="mt-2 small">{{ fullDate(date) }} · {{ time }}</p>
          <p class="mt-2 small text-body-secondary">
            {{ selected.duration }} мин · {{ money(selected.price) }}
          </p>
        </div>
        <h3 class="mt-4 fs-5 fw-semibold">Дальше — подтверждение в DIKIDI</h3>
        <p class="mt-2 small text-body-secondary">
          После подключения настоящего виджета клиент сможет указать контактные данные и подтвердить
          визит. Виктория увидит запись в DIKIDI Business.
        </p>
        <p class="mt-3 small fw-semibold">В этом макете визит не забронирован.</p>
        <button
          type="button"
          class="mt-4 w-100 rounded-3 px-4 py-3 small fw-semibold text-white dikidi-booking-dialog__submit"
          @click="close"
        >
          Вернуться на сайт Виктории
        </button>
        <button
          type="button"
          class="mt-3 w-100 py-2 small text-body-secondary text-decoration-underline link-offset-2"
          @click="stage = 'select'"
        >
          Изменить выбор
        </button>
      </template>
      <p class="mt-4 text-center small text-body-secondary">
        Иллюстрация сценария. Реальный интерфейс DIKIDI может отличаться.
      </p>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { usePractice, addDays, todayKey, type Service } from '../../../entities/practice/index.ts';

import { dayName, fullDate, money, shortDate } from '../../../shared/lib/format/index.ts';

const props = defineProps<{ service: Service | null }>();
const { services } = usePractice();
const open = defineModel<boolean>({ required: true });
const dialog = ref<HTMLDialogElement | null>(null);
const selectedId = ref<number | null>(services.value[0]?.id ?? null);
const selected = computed(
  () => services.value.find((item) => item.id === selectedId.value) ?? services.value[0] ?? null,
);
const dates = ref<string[]>([]);
const date = ref('');
const time = ref('');
const stage = ref<'select' | 'handoff'>('select');
const slots = ['10:00', '11:30', '13:00', '15:00', '16:30'];
let previousOverflow: string | undefined;

function releaseScroll() {
  if (previousOverflow !== undefined) {
    document.body.style.overflow = previousOverflow;
    previousOverflow = undefined;
  }
}

watch(
  open,
  (value) => {
    if (value) {
      selectedId.value = props.service?.id ?? services.value[0]?.id ?? null;
      dates.value = Array.from({ length: 5 }, (_, index) => addDays(todayKey(), index + 1));
      date.value = dates.value[0];
      time.value = '';
      stage.value = 'select';
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.value?.showModal();
    } else {
      dialog.value?.close();
      releaseScroll();
    }
  },
  { flush: 'post' },
);

watch(selectedId, () => {
  time.value = '';
});
onBeforeUnmount(releaseScroll);

function close() {
  open.value = false;
}
function onBackdrop(event: MouseEvent) {
  if (event.target !== dialog.value || !dialog.value) return;
  const bounds = dialog.value.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    close();
}
</script>

<style scoped>
.dikidi-booking-dialog__dialog {
  max-height: 92dvh;
  width: calc(100% - 2rem);
  max-width: 520px;
  color: #202624;
}
.dikidi-booking-dialog__dialog::backdrop {
  background-color: #78475673;
  backdrop-filter: blur(4px);
}
.dikidi-booking-dialog__header {
  z-index: 10;
}
.dikidi-booking-dialog__brand {
  letter-spacing: -0.025em;
}
.dikidi-booking-dialog__brand-dot {
  color: #ff8348;
}
.dikidi-booking-dialog__close {
  width: 2.25rem;
  height: 2.25rem;
}
.dikidi-booking-dialog__close:hover {
  background-color: #e8eae8;
}
.dikidi-booking-dialog__avatar {
  width: 3rem;
  height: 3rem;
}
.dikidi-booking-dialog__group {
  min-width: 0;
}
.dikidi-booking-dialog__date--selected {
  border-color: #292e2c;
  background-color: #292e2c;
}
.dikidi-booking-dialog__date:hover {
  background-color: #f7f8f7;
}
@media (min-width: 768px) {
  .dikidi-booking-dialog__date-label {
    font-size: 0.875rem;
  }
}
.dikidi-booking-dialog__time--selected {
  border-color: #ff8348;
}
.dikidi-booking-dialog__time:hover {
  background-color: #f7f8f7;
}
.dikidi-booking-dialog__submit {
  background-color: #292e2c;
}
.dikidi-booking-dialog__submit:disabled {
  background-color: #b8bfba;
}
</style>
