<template>
  <header
    ref="header"
    class="app-header"
    :class="{ 'app-header--animated': animateMenu }"
    @keydown.esc="closeMenu"
    @focusout="onFocusOut"
  >
    <div
      class="app-header__backdrop"
      :class="{ 'app-header__backdrop--open': open }"
      aria-hidden="true"
      @click="closeMenu"
      @wheel.prevent
    />
    <nav class="navbar navbar-expand-lg container app-header__bar" aria-label="Основная навигация">
      <SectionLink
        to="home"
        class="navbar-brand app-header__brand d-flex align-items-center"
        aria-label="Баня у Виктории — главная"
        @click="open = false"
      >
        <span class="brand-mark" aria-hidden="true">В.</span>
        <span>Виктория<small class="app-header__subtitle d-block">БАНЯ И ОТДЫХ</small></span>
      </SectionLink>
      <SectionLink
        to="contacts"
        class="app-header__contact"
        aria-label="Связаться"
        @click="open = false"
        ><svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path
            d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z"
            stroke-linejoin="round"
          /></svg
      ></SectionLink>
      <button
        ref="toggle"
        type="button"
        class="navbar-toggler app-header__toggle"
        aria-controls="site-navigation"
        :aria-expanded="open"
        :aria-label="open ? 'Закрыть меню' : 'Открыть меню'"
        @click="toggleMenu"
      >
        <span
          class="app-header__toggle-lines d-flex flex-column"
          :class="{ 'app-header__toggle-lines--open': open }"
          aria-hidden="true"
          ><i class="app-header__line d-block"></i><i class="app-header__line d-block"></i
        ></span>
      </button>
      <div
        id="site-navigation"
        class="navbar-collapse app-header__menu"
        :class="{ 'app-header__menu--open': open }"
        :inert="mobile && !open"
      >
        <div class="navbar-nav ms-auto align-items-lg-center gap-lg-3 app-header__links">
          <SectionNavigation
            :active-section="publicPage ? activeSection : undefined"
            @follow="open = false"
          />
          <template v-if="isAdmin">
            <button class="btn btn-primary" @click="navigate('cabinet')">Кабинет</button>
            <button
              class="nav-link app-header__exit"
              @click="
                open = false;
                emit('leave');
              "
            >
              Выйти из демо
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="btn btn-outline-primary app-header__cabinet d-inline-flex align-items-center justify-content-center text-nowrap"
              @click="
                open = false;
                emit('enter');
              "
            >
              <svg
                class="app-header__cabinet-icon flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20v-1a7 7 0 0 1 14 0v1" stroke-linecap="round" />
              </svg>
              Кабинет
            </button>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { type View, type SiteSection } from '../../../shared/routing/index.ts';

import { SectionLink } from '../../../shared/ui/index.ts';

import SectionNavigation from './SectionNavigation.vue';
const props = defineProps<{
  view: View;
  isAdmin: boolean;
  publicPage: boolean;
  activeSection: SiteSection;
}>();
const emit = defineEmits<{ navigate: [view: View]; enter: []; leave: [] }>();
const open = ref(false);
const animateMenu = ref(false);
function toggleMenu() {
  animateMenu.value = true;
  open.value = !open.value;
}
const mobile = ref(false);
const header = ref<HTMLElement | null>(null);
const toggle = ref<HTMLButtonElement | null>(null);
let media: MediaQueryList | undefined;
function updateViewport() {
  animateMenu.value = false;
  mobile.value = media?.matches ?? false;
  open.value = false;
}
function onFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && !header.value?.contains(event.relatedTarget))
    open.value = false;
}
onMounted(() => {
  media = window.matchMedia('(max-width: 991.98px)');
  updateViewport();
  media.addEventListener('change', updateViewport);
});
onUnmounted(() => media?.removeEventListener('change', updateViewport));
function navigate(view: View) {
  open.value = false;
  emit('navigate', view);
}
async function closeMenu() {
  open.value = false;
  await nextTick();
  toggle.value?.focus({ preventScroll: true });
}
watch(
  () => props.view,
  () => {
    open.value = false;
  },
);
</script>

<style scoped>
.app-header__contact {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid #ba9268;
  background: linear-gradient(115deg, #8e643f, #765033);
  color: white;
  display: grid;
  place-items: center;
  margin-left: auto;
  margin-right: 12px;
}
.app-header__contact svg {
  width: 22px;
  height: 22px;
  animation: phone-ring 6s infinite;
}
@keyframes phone-ring {
  0%,
  8%,
  100% {
    transform: rotate(0);
  }
  2%,
  6% {
    transform: rotate(-12deg);
  }
  4% {
    transform: rotate(12deg);
  }
}
@media (min-width: 992px) {
  .app-header__contact {
    order: 3;
    margin-left: 16px;
    margin-right: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .app-header__contact svg {
    animation: none;
  }
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgb(247 244 233 / 92%);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #d8d9c699;
}
.app-header__bar {
  position: relative;
  padding: 20px calc(var(--bs-gutter-x) * 0.5);
}
.app-header__brand {
  gap: 13px;
  color: var(--ink);
  font-family: var(--display);
  font-size: 28px;
  line-height: 1;
}
.app-header__subtitle {
  margin-top: 9px;
  font:
    10px 'Manrope',
    sans-serif;
  letter-spacing: 0.18em;
}
.app-header__exit {
  font-size: 15px;
  color: var(--muted);
  background: transparent;
  border: 0;
  padding: 12px;
  transition: color 0.2s;
}
.app-header__exit:hover {
  color: var(--brand);
  text-decoration: underline;
  text-underline-offset: 8px;
  text-decoration-color: #8b9474;
}
.app-header__cabinet {
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
}
.app-header__cabinet-icon {
  width: 18px;
  height: 18px;
}
.app-header__toggle {
  width: 46px;
  height: 46px;
  border: 1px solid #cbcdb7;
  border-radius: 50%;
  box-shadow: none;
  flex-shrink: 0;
}
.app-header__toggle-lines {
  gap: 6px;
}
.app-header__line {
  background: var(--ink);
  height: 1px;
  width: 20px;
  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);
}
.app-header__toggle-lines--open .app-header__line:first-child {
  transform: translateY(3.5px) rotate(45deg);
}
.app-header__toggle-lines--open .app-header__line:last-child {
  transform: translateY(-3.5px) rotate(-45deg);
}
.app-header__backdrop {
  display: none;
}
@media (max-width: 991.98px) {
  .app-header__backdrop {
    display: block;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    height: 100dvh;
    background: rgb(39 46 31 / 22%);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    touch-action: none;
  }
  .app-header__backdrop--open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
  .app-header__menu {
    position: absolute;
    z-index: 1;
    top: calc(100% + 8px);
    left: calc(var(--bs-gutter-x) * 0.5);
    right: calc(var(--bs-gutter-x) * 0.5);
    padding: 20px;
    max-height: calc(100dvh - 116px);
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid #f9f7ec;
    border-radius: 24px;
    background: linear-gradient(135deg, #faf8ee, #e7e8d9);
    box-shadow: 0 22px 50px -20px #3e4b3350;
    transform: translateY(-12px) scale(0.98);
    transform-origin: top right;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  .app-header--animated .app-header__menu {
    transition:
      transform 350ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 250ms ease,
      visibility 350ms;
  }
  .app-header--animated .app-header__backdrop {
    transition:
      opacity 300ms ease,
      visibility 300ms;
  }
  .app-header__menu--open {
    transform: translateY(0) scale(1);
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
  .app-header__links {
    gap: 12px;
  }
  .app-header__exit {
    padding: 15px 4px;
    text-align: left;
    border-bottom: 1px solid var(--line);
  }
  .app-header__cabinet {
    font-size: 15px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .app-header--animated .app-header__menu,
  .app-header--animated .app-header__backdrop,
  .app-header__line {
    transition: none;
  }
}
@media (max-width: 767.98px) {
  .app-header__bar {
    padding-top: 13px;
    padding-bottom: 13px;
  }
  .app-header__brand {
    font-size: 26px;
    gap: 11px;
  }
  .app-header__subtitle {
    font-size: 9px;
    margin-top: 7px;
  }
}
</style>
