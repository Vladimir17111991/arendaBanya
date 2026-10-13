<template>
  <div
    class="mx-4 mt-3 d-flex flex-wrap align-items-center gap-3 rounded-3 border bg-light px-3 py-2 small mx-md-5 gap-md-3 mx-xl-auto demo-profile-switcher__container"
  >
    <label for="profile" class="small">Демо-профиль</label>
    <select
      id="profile"
      v-model="selected"
      class="w-auto flex-grow-1 p-2 small form-select demo-profile-switcher__select"
    >
      <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
        {{ profile.name
        }}{{
          profile.role === 'guest'
            ? ' · без доступа'
            : profile.role === 'admin'
              ? ' · администратор'
              : ' · клиент'
        }}
      </option>
    </select>
    <span class="ms-auto d-none small text-body-secondary d-lg-block">
      Демонстрация входа · данные и фото сбросятся при обновлении
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Profile } from '../../../entities/practice/index.ts';

const props = defineProps<{ currentId: string; profiles: readonly Profile[] }>();
const emit = defineEmits<{ change: [id: string] }>();
const selected = computed({ get: () => props.currentId, set: (id: string) => emit('change', id) });
</script>

<style scoped>
.demo-profile-switcher__container {
  max-width: 1160px;
}
.demo-profile-switcher__select {
  min-width: 0;
}
@media (min-width: 768px) {
  .demo-profile-switcher__select {
    max-width: 16rem;
  }
}
</style>
