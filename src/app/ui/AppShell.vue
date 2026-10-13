<template>
  <a class="skip-link position-fixed" href="#main-content">Перейти к содержимому</a>
  <AppHeader
    :view="view"
    :is-admin="isAdmin"
    :public-page="publicPage"
    :active-section="activeSection"
    @navigate="navigate"
    @enter="enterAdmin"
    @leave="leaveAdmin"
  />
  <main
    id="main-content"
    ref="main"
    tabindex="-1"
    :class="{ 'practice-demo__admin container pb-5': !publicPage }"
  >
    <details v-if="!publicPage" class="practice-demo__notice mt-3">
      <summary>Демо-режим · данные до обновления страницы</summary>
      <p class="mt-2 mb-0">
        Кабинет пока без авторизации. Данные и фото сохраняются только до обновления страницы.
      </p>
    </details>
    <Transition name="page" mode="out-in" @after-enter="finishNavigation">
      <ServicesView v-if="publicPage" key="home" />
      <BookingView v-else-if="view === 'booking'" :key="`booking-${bookingSession}`" />
      <CabinetView v-else key="admin" />
    </Transition>
  </main>
  <BackToTop :mobile-hidden="publicPage" />
  <ContactRequestDialog
    :request="contactRequest"
    @close="closeContactRequest"
    @closed="restoreContactFocus"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AppHeader } from '../../widgets/site-header/index.ts';
import { ServicesView } from '../../pages/home/index.ts';
import { BookingView } from '../../pages/booking/index.ts';
import { CabinetView } from '../../pages/cabinet/index.ts';
import { BackToTop } from '../../shared/ui/index.ts';
import { usePractice } from '../../entities/practice/index.ts';
import { useBrowserTools } from '../providers/useBrowserTools.ts';
import { provideSiteNavigation } from '../providers/useSiteNavigation.ts';
import {
  provideContactRequest,
  ContactRequestDialog,
} from '../../features/contact-specialist/index.ts';

import { useNavigation } from '../../shared/routing/index.ts';
const store = usePractice();
const navigation = useNavigation();
useBrowserTools(store, navigation);
const { isAdmin } = store;
const { view, bookingSession, navigate } = navigation;
const main = ref<HTMLElement | null>(null);
const { publicPage, activeSection, finishNavigation } = provideSiteNavigation(
  store,
  navigation,
  main,
);
const { contactRequest, closeContactRequest, restoreContactFocus } = provideContactRequest();
function enterAdmin() {
  store.switchProfile('victoria');
  navigate('cabinet', { tab: 'overview' });
}
function leaveAdmin() {
  store.switchProfile('guest');
  navigate('services');
}
</script>

<style scoped>
.skip-link {
  left: 1rem;
  top: -100px;
  z-index: 1200;
  padding: 1rem;
  background: var(--cream);
}
.skip-link:focus {
  top: 1rem;
}
.practice-demo__admin {
  min-height: 65vh;
}
.practice-demo__notice {
  padding: 10px 14px;
  border: 1px solid #e9d9d2;
  border-radius: 12px;
  color: #725448;
  background: #f8eee7;
  font-size: 11px;
  line-height: 1.6;
}
.page-enter-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.page-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>
