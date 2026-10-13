import { inject, provide, type InjectionKey, type Ref } from 'vue';

// Route contracts only. The app layer owns state, guards and browser history.
export type View = 'services' | 'price' | 'works' | 'contacts' | 'access' | 'booking' | 'cabinet';
export type CabinetTab = 'overview' | 'clients' | 'schedule' | 'price' | 'photos' | 'site-photos';
export interface BookingPrefill {
  clientId?: string;
  date?: string;
}
export const sections = ['home', 'work-gallery', 'price-list', 'availability', 'contacts'] as const;
export type SiteSection = (typeof sections)[number];
export interface NavigationOptions {
  reset?: boolean;
  tab?: CabinetTab;
  booking?: BookingPrefill;
}
export interface Navigation {
  view: Readonly<Ref<View>>;
  cabinetTab: Ref<CabinetTab>;
  bookingSession: Readonly<Ref<number>>;
  bookingPrefill: Readonly<Ref<BookingPrefill>>;
  navigate: (view: View, options?: NavigationOptions) => void;
}

const navigationKey: InjectionKey<Navigation> = Symbol('navigation');
const siteNavigationKey: InjectionKey<{ navigateToSection: (section: SiteSection) => void }> =
  Symbol('site-navigation');

export function provideNavigation(navigation: Navigation) {
  provide(navigationKey, navigation);
}
export function useNavigation(): Navigation {
  const navigation = inject(navigationKey);
  if (!navigation) throw new Error('Navigation is not provided');
  return navigation;
}
export function provideSectionNavigation(navigateToSection: (section: SiteSection) => void) {
  provide(siteNavigationKey, { navigateToSection });
}
export function useSiteNavigation() {
  const navigation = inject(siteNavigationKey);
  if (!navigation) throw new Error('Site navigation is not provided');
  return navigation;
}
