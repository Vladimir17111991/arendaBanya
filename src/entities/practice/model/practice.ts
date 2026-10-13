import { computed, inject, provide, readonly, ref, type InjectionKey } from 'vue';
import { createDemoClients, profiles as demoProfiles } from '../config/demo.ts';
import { createCatalog } from './catalog.ts';
import { createSiteImages } from './site-images.ts';
import { canComplete, completedVisits, visitNumber } from '../lib/visits.ts';
import { prepareBooking, prepareClient } from '../lib/booking.ts';
import {
  activeBookings,
  bookingDates,
  bookingsForClient,
  closureConflicts,
  isDateKey,
  todayKey,
  weekday,
} from '../lib/schedule.ts';
import type {
  Booking,
  BookingDraft,
  BookingFilter,
  ClosedPeriod,
  Service,
  WorkPhoto,
  SiteImage,
  SiteImageSlot,
} from './types.ts';

export function createPracticeStore(
  now = () => new Date(),
  options: {
    photos?: readonly WorkPhoto[];
    siteImages?: Partial<Record<SiteImageSlot, SiteImage>>;
  } = {},
) {
  const profiles = ref(demoProfiles.map((profile) => ({ ...profile })));
  const catalog = createCatalog(requireAdmin, options.photos);
  const siteMedia = createSiteImages(requireAdmin, options.siteImages);
  const { services } = catalog;
  const currentId = ref('guest');
  const selectedServiceId = ref<number | null>(services.value[0]?.id ?? null);
  const selectedService = computed(
    () =>
      services.value.find((item) => item.id === selectedServiceId.value) ??
      services.value[0] ??
      null,
  );
  const clients = ref(createDemoClients());
  const bookings = ref<Booking[]>([]);
  const daysOff = ref<number[]>([]);
  const breaks = ref<ClosedPeriod[]>([]);
  const clock = ref(now());
  const feedback = ref('');
  const closureError = ref('');
  const conflicts = ref<Booking[]>([]);
  const adminDate = ref('');
  const adminStatus = ref<BookingFilter>('confirmed');

  const currentUser = computed(
    () => profiles.value.find((profile) => profile.id === currentId.value) ?? profiles.value[0],
  );
  const isAdmin = computed(() => currentUser.value.role === 'admin');
  const isGuest = computed(() => currentUser.value.role === 'guest');
  const currentClient = computed(() =>
    clients.value.find((client) => client.accountId === currentId.value),
  );
  const today = computed(() => todayKey(clock.value));
  const ownBookings = computed(() => bookingsForClient(bookings.value, currentClient.value?.id));
  const visibleBookings = computed(() =>
    (isAdmin.value ? bookings.value : ownBookings.value)
      .filter(
        (item) =>
          !isAdmin.value ||
          ((!adminDate.value || bookingDates(item).includes(adminDate.value)) &&
            (adminStatus.value === 'all' || item.status === adminStatus.value)),
      )
      .toSorted((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
  );
  const activeCount = computed(
    () => activeBookings(isAdmin.value ? bookings.value : ownBookings.value).length,
  );
  const nextBooking = computed(
    () =>
      ownBookings.value
        .filter(
          (item) =>
            item.status === 'confirmed' &&
            new Date(`${item.date}T${item.time}:00+03:00`) > clock.value,
        )
        .toSorted((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0],
  );

  function switchProfile(id: string) {
    if (!profiles.value.some((profile) => profile.id === id)) return;
    currentId.value = id;
    feedback.value = '';
    clearClosureError();
  }

  function selectService(service: Service | null) {
    selectedServiceId.value = service?.id ?? null;
  }
  function refreshClock() {
    clock.value = now();
  }

  function book(draft: BookingDraft): Booking {
    const service = services.value.find((item) => item.id === draft.service.id);
    if (!service) throw new Error('Этот вариант аренды больше не доступен.');
    const result = prepareBooking({
      ...draft,
      service,
      actor: currentUser.value,
      clients: clients.value,
      bookings: bookings.value,
      daysOff: daysOff.value,
      breaks: breaks.value,
      now: now(),
    });
    if (result.newClient) clients.value.push(result.newClient);
    bookings.value.push(result.booking);
    return result.booking;
  }

  function requireAdmin() {
    if (!isAdmin.value) throw new Error('Это действие доступно только Виктории.');
  }

  function enableClientAccess(clientId: string) {
    requireAdmin();
    const client = clients.value.find((item) => item.id === clientId);
    if (!client) throw new Error('Клиент не найден.');
    if (client.accountId) return;
    client.accountId = client.id;
    profiles.value.push({ id: client.id, name: client.name, role: 'client' });
  }

  function addClient(name: string, phone: string) {
    requireAdmin();
    const client = prepareClient(clients.value, name, phone);
    client.id = crypto.randomUUID();
    clients.value.push(client);
    return client;
  }

  function visitsForClient(id: string) {
    const client = clients.value.find((item) => item.id === id);
    return client ? completedVisits(client, bookings.value) : 0;
  }
  function numberForVisit(booking: Booking) {
    const client = clients.value.find((item) => item.id === booking.clientId);
    return client ? visitNumber(client, booking, bookings.value) : 1;
  }
  function setPreviousVisits(id: string, count: number) {
    requireAdmin();
    if (!Number.isInteger(count) || count < 0 || count > 10000)
      throw new Error('Укажите целое число посещений от 0 до 10 000.');
    const client = clients.value.find((item) => item.id === id);
    if (!client) throw new Error('Клиент не найден.');
    client.previousVisits = count;
  }
  function completeBooking(id: string) {
    requireAdmin();
    const booking = bookings.value.find((item) => item.id === id);
    if (!booking || !canComplete(booking, now()))
      throw new Error('Завершить можно только подтверждённую бронь после окончания аренды.');
    booking.status = 'completed';
    adminStatus.value = 'all';
    feedback.value = 'Аренда завершена. Счётчик посещений обновлён.';
  }
  function undoCompletion(id: string) {
    requireAdmin();
    const booking = bookings.value.find((item) => item.id === id);
    if (!booking || booking.status !== 'completed') return;
    booking.status = 'confirmed';
    feedback.value = 'Отметка о посещении снята. Счётчик пересчитан.';
  }

  function focusBooking(booking: Booking) {
    if (isAdmin.value) {
      adminDate.value = booking.date;
      adminStatus.value = 'confirmed';
    }
  }

  function cancelBooking(id: string) {
    const booking = bookings.value.find((item) => item.id === id);
    if (
      !booking ||
      booking.status !== 'confirmed' ||
      (!isAdmin.value && booking.clientId !== currentClient.value?.id)
    )
      return;
    booking.status = 'cancelled';
    conflicts.value = conflicts.value.filter((item) => item.id !== id);
    feedback.value = 'Запись отменена. Время снова доступно для бронирования.';
  }

  function clearClosureError() {
    closureError.value = '';
    conflicts.value = [];
  }
  function reportConflicts(records: Booking[]): boolean {
    if (!records.length) return false;
    conflicts.value = records;
    closureError.value =
      'На эти даты уже есть записи. Сначала согласуйте с клиентами отмену или перенос, затем закройте даты.';
    return true;
  }

  function toggleDayOff(day: number) {
    if (!isAdmin.value) return;
    if (!Number.isInteger(day) || day < 0 || day > 6) return;
    clearClosureError();
    if (daysOff.value.includes(day)) {
      daysOff.value = daysOff.value.filter((value) => value !== day);
      feedback.value = 'Рабочие дни обновлены.';
      return;
    }
    if (
      reportConflicts(closureConflicts(bookings.value, (key) => weekday(key) === day, today.value))
    )
      return;
    daysOff.value.push(day);
    feedback.value = 'Выходной добавлен. Эти дни скрыты из доступных дат.';
  }

  function addBreak(period: Omit<ClosedPeriod, 'id'>) {
    if (!isAdmin.value) return;
    clearClosureError();
    const { start, end } = period;
    if (!isDateKey(start) || !isDateKey(end) || start < today.value || end < start) {
      closureError.value = 'Выберите корректный период, начиная с сегодняшнего дня.';
      return;
    }
    if (
      reportConflicts(
        closureConflicts(bookings.value, (key) => start <= key && key <= end, today.value),
      )
    )
      return;
    if (breaks.value.some((item) => item.start <= end && item.end >= start)) {
      closureError.value = 'Этот период пересекается с уже закрытыми датами.';
      return;
    }
    breaks.value.push({ ...period, id: crypto.randomUUID() });
    feedback.value = 'Даты закрыты для новых записей.';
  }

  function removeBreak(id: string) {
    if (!isAdmin.value) return;
    breaks.value = breaks.value.filter((item) => item.id !== id);
    feedback.value = 'Период открыт. Регулярные выходные продолжают действовать.';
  }

  // One store per mounted app; no module-level mutable state or demo authentication claims.
  return {
    ...catalog,
    ...siteMedia,
    dispose() {
      catalog.dispose();
      siteMedia.dispose();
    },
    currentId: readonly(currentId),
    currentUser,
    currentClient,
    isAdmin,
    isGuest,
    profiles: readonly(profiles),
    selectedService: readonly(selectedService),
    clients: readonly(clients),
    bookings: readonly(bookings),
    daysOff: readonly(daysOff),
    breaks: readonly(breaks),
    clock: readonly(clock),
    today,
    feedback: readonly(feedback),
    closureError: readonly(closureError),
    conflicts: readonly(conflicts),
    adminDate,
    adminStatus,
    visibleBookings,
    activeCount,
    nextBooking,
    switchProfile,
    selectService,
    refreshClock,
    book,
    addClient,
    enableClientAccess,
    visitsForClient,
    numberForVisit,
    setPreviousVisits,
    completeBooking,
    undoCompletion,
    focusBooking,
    cancelBooking,
    toggleDayOff,
    addBreak,
    removeBreak,
  };
}

export type PracticeStore = ReturnType<typeof createPracticeStore>;
const practiceKey: InjectionKey<PracticeStore> = Symbol('practice');

export function providePractice(store: PracticeStore) {
  provide(practiceKey, store);
}
export function usePractice(): PracticeStore {
  const store = inject(practiceKey);
  if (!store) throw new Error('Practice store must be provided by App.vue');
  return store;
}
