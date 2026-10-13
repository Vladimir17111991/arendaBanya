<template>
  <section class="clients-panel">
    <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
      <h2 class="fs-5 fw-semibold mb-0">
        Клиенты <span class="clients-panel__count">{{ clients.length }}</span>
      </h2>
      <button
        type="button"
        class="btn btn-outline-primary clients-panel__add"
        :aria-expanded="adding"
        @click="toggleForm"
      >
        {{ adding ? 'Закрыть' : '＋ Новый' }}
      </button>
    </div>
    <form v-if="adding" class="card p-3 mb-3" @submit.prevent="submit">
      <h3 class="fs-6 fw-semibold mb-3">Новый клиент</h3>
      <label for="client-name" class="form-label small">Имя клиента</label>
      <input
        id="client-name"
        ref="nameInput"
        v-model="name"
        class="form-control mb-3"
        required
        maxlength="60"
        autocomplete="off"
        placeholder="Например, Елена"
      />
      <label for="client-phone" class="form-label small">Телефон</label>
      <input
        id="client-phone"
        v-model="phone"
        class="form-control"
        required
        type="tel"
        autocomplete="off"
        placeholder="+375 (00) 000-00-03"
      />
      <p v-if="error" role="alert" class="alert alert-warning mt-3 small">{{ error }}</p>
      <BaseButton type="submit" class="mt-3 w-100">Сохранить клиента</BaseButton>
    </form>
    <label for="client-search" class="visually-hidden">Поиск клиента</label>
    <input
      id="client-search"
      v-model="query"
      class="form-control mb-3"
      type="search"
      placeholder="Имя или телефон"
    />
    <p v-if="message" role="status" class="alert practice-notice">{{ message }}</p>
    <p v-if="!filtered.length" class="p-3 text-muted small">
      {{
        query
          ? 'Никого не нашли. Попробуйте другое имя или телефон.'
          : 'Добавьте первого клиента — его брони будут под рукой.'
      }}
    </p>
    <div class="clients-panel__list" :class="{ 'clients-panel__list--full': !compact }">
      <article v-for="client in visible" :key="client.id" class="clients-panel__card card p-3">
        <div class="d-flex gap-2 align-items-center">
          <span class="clients-panel__avatar flex-shrink-0" aria-hidden="true">{{
            client.name[0]
          }}</span>
          <div class="flex-grow-1 clients-panel__identity">
            <h3 class="fs-6 fw-semibold mb-1 text-break">{{ client.name }}</h3>
            <p class="clients-panel__phone text-muted mb-0">{{ client.phone }}</p>
          </div>
          <button
            type="button"
            class="btn btn-outline-primary clients-panel__book"
            :aria-label="'Добавить бронь: ' + client.name"
            @click="emit('book', client.id)"
          >
            Бронь
          </button>
        </div>
        <p class="small mt-3 mb-1">
          <strong>{{ visitsForClient(client.id) }}</strong> посещений · следующий №{{
            visitsForClient(client.id) + 1
          }}
        </p>
        <p class="small text-muted mb-2">{{ nextVisit(client.id) }}</p>
        <details class="clients-panel__details">
          <summary class="small">Карточка и история аренды</summary>
          <div class="mt-3"><ClientVisitSummary :client="client" /></div>
          <div v-if="history(client.id).length" class="mt-3">
            <h4 class="small fw-semibold">Последние брони</h4>
            <p
              v-for="visit in history(client.id)"
              :key="visit.id"
              class="clients-panel__history small mb-2"
            >
              {{ shortDate(visit.date) }} · {{ visit.time }} —
              {{ shortDate(bookingEnd(visit).date) }} · {{ bookingEnd(visit).time }}<br />
              {{ visit.service.name }}<br />
              Гостей: {{ visit.guestCount ?? 1 }} · Итого: {{ money(visit.service.price) }}<br />
              <span class="text-muted">{{
                visit.status === 'completed'
                  ? 'Завершена'
                  : visit.status === 'cancelled'
                    ? 'Отменена'
                    : 'Подтверждена'
              }}</span>
            </p>
          </div>
        </details>
      </article>
    </div>
    <button
      v-if="visible.length < filtered.length"
      type="button"
      class="btn btn-link w-100 mt-2"
      @click="limit += 6"
    >
      Показать ещё клиентов
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { usePractice, matchesClient, bookingEnd } from '../../../entities/practice/index.ts';
import { shortDate, money } from '../../../shared/lib/format/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
import ClientVisitSummary from './ClientVisitSummary.vue';
const props = defineProps<{ compact?: boolean }>();
const emit = defineEmits<{ book: [clientId: string] }>();
const { clients, bookings, clock, visitsForClient, addClient } = usePractice();
const name = ref('');
const phone = ref('');
const query = ref('');
const error = ref('');
const message = ref('');
const adding = ref(false);
const nameInput = ref<HTMLInputElement | null>(null);
const limit = ref(props.compact ? 4 : 12);
const filtered = computed(() =>
  clients.value.filter((client) => matchesClient(client, query.value)),
);
const visible = computed(() => filtered.value.slice(0, limit.value));
watch(query, () => {
  limit.value = props.compact ? 4 : 12;
});
function nextVisit(clientId: string) {
  const visit = bookings.value
    .filter(
      (item) =>
        item.clientId === clientId &&
        item.status === 'confirmed' &&
        new Date(bookingEnd(item).date + 'T' + bookingEnd(item).time + ':00+03:00') > clock.value,
    )
    .toSorted((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  return visit
    ? 'Бронь: ' +
        shortDate(visit.date) +
        ', ' +
        visit.time +
        ' — ' +
        shortDate(bookingEnd(visit).date) +
        ', ' +
        bookingEnd(visit).time
    : 'Следующая бронь ещё не назначена';
}
function history(clientId: string) {
  return bookings.value
    .filter((item) => item.clientId === clientId)
    .toSorted((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, 3);
}
async function toggleForm() {
  adding.value = !adding.value;
  if (adding.value) {
    await nextTick();
    nameInput.value?.focus();
  }
}
function submit() {
  error.value = '';
  message.value = '';
  try {
    const client = addClient(name.value, phone.value);
    message.value = client.name + ': карточка добавлена.';
    name.value = '';
    phone.value = '';
    query.value = client.name;
    adding.value = false;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось добавить клиента.';
  }
}
</script>

<style scoped>
.clients-panel {
  min-width: 0;
}
.clients-panel__count {
  color: var(--muted);
  font-size: 13px;
  margin-left: 6px;
  font-weight: 400;
}
.clients-panel__add,
.clients-panel__book {
  min-height: 44px;
  padding: 8px 12px;
  font-size: 12px;
  flex-shrink: 0;
}
.clients-panel__list {
  display: grid;
  gap: 12px;
}
.clients-panel__card {
  box-shadow: 0 4px 18px #34462606;
}
.clients-panel__identity {
  min-width: 0;
}
.clients-panel__avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  color: var(--brand);
  background: #e9eedc;
  font-family: var(--display);
  font-size: 20px;
}
.clients-panel__phone {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.clients-panel__details {
  border-top: 1px solid var(--line);
  padding-top: 12px;
}
.clients-panel__history {
  border-left: 2px solid #cdd7b7;
  padding-left: 10px;
}
@media (min-width: 768px) {
  .clients-panel__list--full {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
