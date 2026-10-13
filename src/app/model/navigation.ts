import { readonly, ref } from 'vue';
import type {
  Navigation,
  NavigationOptions,
  View,
  CabinetTab,
  BookingPrefill,
} from '../../shared/routing/index.ts';

export function createNavigation(isGuest: () => boolean): Navigation {
  const view = ref<View>('services');
  const cabinetTab = ref<CabinetTab>('overview');
  const bookingSession = ref(0);
  const bookingPrefill = ref<BookingPrefill>({});

  function navigate(target: View, options: NavigationOptions = {}) {
    const guarded = isGuest() && ['booking', 'cabinet', 'access'].includes(target);
    if (!guarded) {
      if (options.tab) cabinetTab.value = options.tab;
      if (target === 'booking' && options.reset) {
        bookingPrefill.value = { ...options.booking };
        bookingSession.value += 1;
      }
    }
    view.value = guarded ? 'contacts' : target;
  }

  return {
    view: readonly(view),
    cabinetTab,
    bookingSession: readonly(bookingSession),
    bookingPrefill: readonly(bookingPrefill),
    navigate,
  };
}
