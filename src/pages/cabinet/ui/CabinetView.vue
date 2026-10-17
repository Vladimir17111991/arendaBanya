<template>
  <section class="cabinet pt-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="cabinet__title mb-1">Личный кабинет</h1>
        <p class="small text-muted mb-0 d-none d-sm-block">
          Клиенты, брони и фотографии бани — всё под рукой.
        </p>
      </div>
      <BaseButton class="cabinet__create" aria-label="Добавить бронь" @click="startBooking()"
        ><span aria-hidden="true">＋</span><span> Добавить бронь</span></BaseButton
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
    </nav>
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
    <ReviewsPanel v-else-if="tab === 'reviews'" />
    <div v-else class="cabinet__schedule">
      <SchedulePanel @show-bookings="showBookings" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { usePractice } from '../../../entities/practice/index.ts';
import { BaseButton } from '../../../shared/ui/index.ts';
import { SchedulePanel } from '../../../features/manage-schedule/index.ts';
import { ClientsPanel } from '../../../features/manage-clients/index.ts';
import { PriceEditor } from '../../../features/manage-catalog/index.ts';
import { PhotosPanel } from '../../../features/manage-portfolio/index.ts';
import { SiteImagesPanel } from '../../../features/manage-site-images/index.ts';
import { ReviewsPanel } from '../../../features/manage-reviews/index.ts';
import {
  useNavigation,
  type CabinetTab,
  type BookingPrefill,
} from '../../../shared/routing/index.ts';
import CabinetDashboard from './CabinetDashboard.vue';
const { feedback, adminDate, today } = usePractice();
const { navigate, cabinetTab: tab } = useNavigation();
function showBookings(date: string) {
  adminDate.value = date;
  tab.value = 'overview';
}
function startBooking(prefill?: BookingPrefill) {
  navigate('booking', {
    reset: true,
    booking: prefill ?? (tab.value === 'overview' ? { date: adminDate.value || today.value } : {}),
  });
}
const mainTabs = [
  { id: 'overview', label: 'Брони' },
  { id: 'clients', label: 'Клиенты' },
  { id: 'schedule', label: 'Даты' },
  { id: 'price', label: 'Тарифы' },
  { id: 'photos', label: 'Галерея' },
  { id: 'site-photos', label: 'Фото сайта' },
  { id: 'reviews', label: 'Отзывы' },
] satisfies { id: CabinetTab; label: string }[];
</script>

<style scoped>
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

.cabinet {
  padding-bottom: 32px;
}
.cabinet__tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  padding: 8px;
  background: #f0edea;
  border: 1px solid #dbced8;
}
.cabinet__tab {
  padding: 12px 8px;
  font-size: 15px;
  color: #60465a;
}
.cabinet__tab--active {
  background: #77566f;
  color: white;
  box-shadow: 0 4px 14px #77566f25;
}
.cabinet__tab--active:hover {
  background: #85607c;
}
.cabinet__create {
  width: auto;
  min-height: 48px;
  height: auto;
  padding: 12px 18px;
  font-size: 16px;
  border-radius: 14px;
}
@media (max-width: 767.98px) {
  .cabinet__tabs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .cabinet__title {
    font-size: 30px;
  }
}
</style>
