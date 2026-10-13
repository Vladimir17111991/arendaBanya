<template>
  <fieldset class="mb-4 client-picker__group">
    <legend class="mb-3 fw-semibold fs-6">Клиент</legend>
    <div class="d-flex flex-wrap gap-3 border-bottom pb-3">
      <label class="d-flex align-items-center gap-2 small"
        ><input
          v-model="mode"
          class="form-check-input flex-shrink-0"
          type="radio"
          name="client-mode"
          value="existing"
        />
        Из базы</label
      >
      <label class="d-flex align-items-center gap-2 small"
        ><input
          v-model="mode"
          class="form-check-input flex-shrink-0"
          type="radio"
          name="client-mode"
          value="new"
        />
        Новый клиент</label
      >
    </div>
    <template v-if="mode === 'existing'">
      <label for="client-search" class="form-label mt-4 mb-2 d-block small fw-semibold"
        >Поиск по имени или телефону</label
      >
      <input
        id="client-search"
        v-model="search"
        class="form-control"
        type="search"
        placeholder="Например, Анна или последние цифры номера"
        autocomplete="off"
      />
      <div
        v-if="filtered.length"
        class="mt-3 overflow-y-auto rounded-3 border client-picker__results"
        role="group"
        aria-label="Клиенты из базы"
      >
        <label
          v-for="client in filtered"
          :key="client.id"
          class="d-flex align-items-center gap-3 border-bottom p-3 small client-picker__option"
          :class="{ 'bg-success-subtle client-picker__option--selected': selectedId === client.id }"
        >
          <input
            v-model="selectedId"
            class="form-check-input flex-shrink-0"
            type="radio"
            name="client-choice"
            :value="client.id"
            required
          />
          <span class="grid gap-1 client-picker__identity"
            ><strong class="text-break small">{{ client.name }}</strong
            ><span>{{ client.phone }}</span></span
          >
        </label>
      </div>
      <template v-else>
        <p class="mt-3 small text-body-secondary">
          Клиент не найден. Проверьте поиск или добавьте нового.
        </p>
        <BaseButton variant="text" @click="mode = 'new'">Добавить нового клиента</BaseButton>
      </template>
      <p v-if="selected" class="mt-3 small text-break text-success" role="status">
        Выбран клиент: <strong>{{ selected.name }}</strong> · {{ selected.phone }}
      </p>
      <p v-if="selected" class="mt-2 rounded-2 bg-primary-subtle p-3 small">
        Посещений: {{ visitsForClient(selected.id) }} · Следующее посещение №{{
          visitsForClient(selected.id) + 1
        }}<small class="mt-1 d-block small text-body-secondary"
          >Будущие и отменённые брони не учитываются.</small
        >
      </p>
    </template>
    <template v-else>
      <label for="new-client-name" class="form-label mt-4 mb-2 d-block small fw-semibold"
        >Имя клиента</label
      >
      <input
        id="new-client-name"
        v-model.trim="name"
        class="form-control"
        required
        maxlength="60"
        autocomplete="off"
        placeholder="Например, Елена"
      />
      <label for="new-client-phone" class="form-label mt-4 mb-2 d-block small fw-semibold"
        >Телефон клиента</label
      >
      <input
        id="new-client-phone"
        v-model="phone"
        class="form-control"
        required
        type="tel"
        maxlength="24"
        autocomplete="off"
        placeholder="+375 (29) 000-00-00"
        aria-describedby="new-client-note"
      />
      <p id="new-client-note" class="mt-3 small text-body-secondary">
        Регистрация не требуется. Для проверки используйте вымышленные данные.
      </p>
      <div
        v-if="duplicate"
        class="mt-3 rounded-2 border border-warning-subtle bg-warning-subtle p-3 small"
        role="status"
      >
        <p>
          Этот телефон уже есть у клиента <strong>{{ duplicate.name }}</strong
          >.
        </p>
        <BaseButton variant="text" class="ps-0 text-start" @click="selectExisting(duplicate)"
          >Выбрать существующего клиента</BaseButton
        >
      </div>
    </template>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  findClientByPhone,
  matchesClient,
  type Client,
  type CustomerSelection,
  usePractice,
} from '../../../entities/practice/index.ts';

import { BaseButton } from '../../../shared/ui/index.ts';

const { visitsForClient } = usePractice();

const props = defineProps<{ clients: readonly Client[] }>();
const customer = defineModel<CustomerSelection>({ required: true });
const query = ref('');
const search = computed({
  get: () => query.value,
  set: (value: string) => {
    query.value = value;
    customer.value = { mode: 'existing', clientId: '' };
  },
});
const mode = computed({
  get: () => customer.value.mode,
  set: (value: CustomerSelection['mode']) => {
    query.value = '';
    customer.value =
      value === 'existing' ? { mode: value, clientId: '' } : { mode: value, name: '', phone: '' };
  },
});
const selectedId = computed({
  get: () => (customer.value.mode === 'existing' ? customer.value.clientId : ''),
  set: (clientId: string) => {
    customer.value = { mode: 'existing', clientId };
  },
});
const name = computed({
  get: () => (customer.value.mode === 'new' ? customer.value.name : ''),
  set: (value: string) => {
    if (customer.value.mode === 'new') customer.value = { ...customer.value, name: value };
  },
});
const phone = computed({
  get: () => (customer.value.mode === 'new' ? customer.value.phone : ''),
  set: (value: string) => {
    if (customer.value.mode === 'new') customer.value = { ...customer.value, phone: value };
  },
});
const filtered = computed(() =>
  props.clients.filter((client) => matchesClient(client, search.value)),
);
const selected = computed(() => props.clients.find((client) => client.id === selectedId.value));
const duplicate = computed(() => findClientByPhone(props.clients, phone.value));
function selectExisting(client: Client) {
  query.value = '';
  customer.value = { mode: 'existing', clientId: client.id };
}
</script>

<style scoped>
.client-picker__group {
  min-width: 0;
}
.client-picker__results {
  max-height: 245px;
}
.client-picker__option:last-child {
  border: 0;
}
.client-picker__option--selected {
  box-shadow: inset 3px 0 #285849;
}
.client-picker__identity {
  min-width: 0;
}
</style>
