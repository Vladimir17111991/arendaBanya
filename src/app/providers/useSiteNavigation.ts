import { computed, nextTick, onMounted, onUnmounted, readonly, ref, watch, type Ref } from 'vue';
import type { PracticeStore } from '../../entities/practice/index.ts';
import {
  sections,
  provideSectionNavigation,
  type View,
  type SiteSection,
  type Navigation,
} from '../../shared/routing/index.ts';
import { scrollToElement } from '../../shared/lib/scroll/index.ts';
import { activeSectionAt, navigationSection } from '../model/activeSection.ts';

const viewSections: Partial<Record<View, SiteSection>> = {
  services: 'home',
  price: 'price-list',
  works: 'work-gallery',
  contacts: 'contacts',
  access: 'contacts',
};

export function provideSiteNavigation(
  store: PracticeStore,
  navigation: Navigation,
  main: Ref<HTMLElement | null>,
) {
  const publicPage = computed(
    () => !store.isAdmin.value || !['cabinet', 'booking'].includes(navigation.view.value),
  );
  const activeSection = ref<SiteSection>('home');
  let pending: { section: SiteSection; behavior: ScrollBehavior } | null = null;
  let scrollFrame = 0;
  let disposed = false;
  let navigationController: AbortController | undefined;

  function cancelNavigation() {
    navigationController?.abort();
    navigationController = undefined;
  }

  function scrollBehavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  }

  async function finishNavigation() {
    if (disposed) return;
    if (!publicPage.value) {
      main.value?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (!pending) return;
    const target = document.getElementById(pending.section);
    if (!target) return; // An admin screen may still be leaving its Vue transition.
    const { section, behavior } = pending;
    pending = null;
    cancelNavigation();
    const controller = new AbortController();
    navigationController = controller;
    activeSection.value = navigationSection(section);
    target.focus({ preventScroll: true });
    // Keep the chosen link highlighted while passing intermediate sections.
    await scrollToElement(target, controller.signal, behavior);
    if (navigationController !== controller || disposed) return;
    navigationController = undefined;
    updateActiveSection();
  }

  function openSection(
    section: SiteSection,
    historyMode: 'push' | 'replace',
    behavior = scrollBehavior(),
  ) {
    cancelNavigation();
    pending = { section, behavior };
    const hash = `#${section}`;
    if (window.location.hash !== hash) {
      const url = `${window.location.pathname}${window.location.search}${hash}`;
      if (historyMode === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    }
    // Public destinations all share the same mounted page and its filter state.
    navigation.navigate('services');
    // Other click handlers can close the mobile menu after this handler returns.
    queueMicrotask(() => {
      void nextTick(finishNavigation);
    });
  }

  function navigateToSection(section: SiteSection) {
    openSection(section, 'push');
  }

  function readHash(): SiteSection | null {
    const hash = window.location.hash.slice(1);
    if (!hash) return 'home';
    if (hash === 'price') return 'price-list';
    if (hash === 'works') return 'work-gallery';
    return sections.find((section) => section === hash) ?? null;
  }

  function followHash() {
    const section = readHash();
    if (section) openSection(section, 'replace');
  }

  function updateActiveSection() {
    scrollFrame = 0;
    if (!publicPage.value || navigationController || disposed) return;
    const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect().height ?? 0;
    const positions = sections.flatMap((section) => {
      const target = document.getElementById(section);
      return target ? [{ section, top: target.getBoundingClientRect().top }] : [];
    });
    const atPageEnd =
      window.scrollY > 0 &&
      document.documentElement.scrollHeight - window.innerHeight - window.scrollY <= 2;
    activeSection.value = activeSectionAt(positions, headerHeight + 140, atPageEnd);
  }

  function onScroll() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateActiveSection);
  }

  watch([navigation.view, navigation.bookingSession], () => {
    if (!publicPage.value) {
      cancelNavigation();
      pending = null;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      void nextTick(finishNavigation);
    } else if (!pending) {
      openSection(viewSections[navigation.view.value] ?? 'home', 'push');
    }
  });

  onMounted(() => {
    window.addEventListener('hashchange', followHash);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const section = readHash();
    if (section) openSection(section, 'replace', 'instant');
  });

  onUnmounted(() => {
    disposed = true;
    cancelNavigation();
    window.cancelAnimationFrame(scrollFrame);
    window.removeEventListener('hashchange', followHash);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  });

  provideSectionNavigation(navigateToSection);
  return { publicPage, activeSection: readonly(activeSection), finishNavigation };
}
