<template>
  <section class="cabinet pt-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <p class="cabinet__eyebrow mb-2 d-none d-sm-block">ЛИЧНЫЙ КАБИНЕТ</p>
        <h1 class="cabinet__title mb-1">Ваш день, Виктория</h1>
        <p class="small text-muted mb-0 d-none d-sm-block">
          Клиенты, брони и фотографии бани — всё под рукой.
        </p>
      </div>
      <BaseButton class="cabinet__create" aria-label="Добавить бронь" @click="startBooking()"
        ><span aria-hidden="true">＋</span
        ><span class="d-none d-sm-inline"> Добавить бронь</span></BaseButton
      >
    </div>
    <nav class="cabinet__tabs mb-4" aria-label="Раздел кабинета">
      <button
        v-for="item in mainTabs"
        :key="item.id"
        type="button"
        class="cabinet__tab"
        :class="{ 'cabinet__tab--active': tab === item.id }"
        :aria-pressed="tab === item.id"
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
      <div class="cabinet__site">
        <label for="cabinet-content" class="visually-hidden">Наполнение сайта</label>
        <select
          id="cabinet-content"
          :value="contentTab ? tab : ''"
          class="form-select cabinet__select"
          :class="{ 'cabinet__select--active': contentTab }"
          @change="changeContent"
        >
          <option value="" disabled>Сайт</option>
          <option value="price">Аренда</option>
          <option value="photos">Галерея бани</option>
          <option value="site-photos">Фото сайта</option>
        </select>
      </div>
    </nav>
    <p class="small text-muted mb-4">
      Демо-кабинет Виктории: данные и фотографии сохраняются до обновления вкладки.
    </p>
    <p
      v-if="feedback && (tab === 'schedule' || tab === 'overview')"
      class="alert practice-notice mb-4"
      role="status"
    >
      {{ feedback }}
    </p>
    <CabinetDashboard v-if="tab === 'overview'" @book="startBooking" @schedule="tab = 'schedule'" />
    <ClientsPanel v-else-if="tab === 'clients'" @book="(clientId) => startBooking({ clientId })" />
    <PriceEditor v-else-if="tab === 'price'" />
    <PhotosPanel v-else-if="tab === 'photos'" @open-price="tab = 'price'" />
    <SiteImagesPanel v-else-if="tab === 'site-photos'" />
    <div v-else class="row gy-5">
      <div class="col-lg-5 order-lg-2"><SchedulePanel /></div>
      <div class="col-lg-7 order-lg-1"><AppointmentsPanel @book="startBooking" /></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePractice } from '../../../entities/practice/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
import { AppointmentsPanel } from '../../../features/manage-appointments/index.ts';
import { SchedulePanel } from '../../../features/manage-schedule/index.ts';
import { ClientsPanel } from '../../../features/manage-clients/index.ts';
import { PriceEditor } from '../../../features/manage-catalog/index.ts';
import { PhotosPanel } from '../../../features/manage-portfolio/index.ts';
import { SiteImagesPanel } from '../../../features/manage-site-images/index.ts';
import {
  useNavigation,
  type CabinetTab,
  type BookingPrefill,
} from '../../../shared/routing/index.ts';
import CabinetDashboard from './CabinetDashboard.vue';
const { feedback, adminDate, today } = usePractice();
const { navigate, cabinetTab: tab } = useNavigation();
function startBooking(prefill?: BookingPrefill) {
  navigate('booking', {
    reset: true,
    booking: prefill ?? (tab.value === 'overview' ? { date: adminDate.value || today.value } : {}),
  });
}
const mainTabs = [
  { id: 'overview', label: 'Мой день' },
  { id: 'clients', label: 'Клиенты' },
  { id: 'schedule', label: 'Расписание' },
] satisfies { id: CabinetTab; label: string }[];
const contentTab = computed(() => ['price', 'photos', 'site-photos'].includes(tab.value));
function changeContent(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'price' || value === 'photos' || value === 'site-photos') tab.value = value;
}
</script>

<style scoped>
.cabinet__eyebrow {
  color: var(--accent);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
}
.cabinet__title {
  font-family: var(--display);
  font-size: clamp(26px, 3vw, 38px);
}
.cabinet__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 6px;
  background: #e8ebdf;
  border-radius: 16px;
}
.cabinet__tab {
  color: #596048;
  background: transparent;
  border: 0;
  border-radius: 11px;
  min-height: 46px;
  padding: 10px 22px;
  font-size: 14px;
  transition:
    background 180ms,
    color 180ms;
}
.cabinet__tab:hover {
  background: #ffffff80;
}
.cabinet__tab--active {
  color: var(--brand);
  background: #fff;
  box-shadow: 0 2px 5px #3340270a;
  font-weight: 600;
}
.cabinet__site {
  margin-left: auto;
}
.cabinet__select {
  background-color: transparent;
  border-color: transparent;
  min-height: 46px;
  font-size: 13px;
  color: var(--muted);
}
.cabinet__select--active {
  background-color: #fff;
}
@media (max-width: 575.98px) {
  .cabinet__create {
    width: 48px;
    height: 48px;
    padding: 8px;
    flex-shrink: 0;
    font-size: 24px;
  }
  .cabinet__tab {
    flex: 1;
    padding: 8px 6px;
    font-size: 12px;
  }
  .cabinet__site {
    width: 76px;
    flex-shrink: 0;
    border-left: 1px solid #d6ddc8;
  }
  .cabinet__select {
    padding-top: 8px;
    padding-bottom: 8px;
    min-height: 42px;
    padding-left: 6px;
    padding-right: 22px;
    background-position: right 5px center;
    background-size: 12px;
    font-size: 12px;
  }
}
@media (max-width: 359.98px) {
  .cabinet__title {
    font-size: 23px;
  }
}
</style>
