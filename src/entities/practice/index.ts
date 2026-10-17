export { createPracticeStore, providePractice, usePractice } from './model/practice.ts';
export type { PracticeStore } from './model/practice.ts';
export type {
  Role,
  Profile,
  Client,
  Category,
  Service,
  ServiceDraft,
  ServiceDetails,
  Booking,
  BookingDraft,
  BookingStatus,
  BookingFilter,
  WorkPhoto,
  PhotoDraft,
  SiteImage,
  SiteImageSlot,
  ClosedPeriod,
  CustomerSelection,
} from './model/types.ts';
export { services, weekdays } from './config/demo.ts';
export { galleryCategoryLabel, groupGalleryPhotos, sortGalleryPhotos } from './lib/gallery.ts';
export {
  prepareBooking,
  prepareClient,
  normalizePhone,
  findClientByPhone,
  matchesClient,
} from './lib/booking.ts';
export type { PrepareBookingOptions } from './lib/booking.ts';
export { MAX_GUESTS, rentalPrice } from './lib/pricing.ts';
export {
  addDays,
  HOURS,
  bookingEnd,
  bookingDates,
  isDateKey,
  BOOKING_HORIZON_DAYS,
  todayKey,
  weekday,
  freeSlots,
  isClosed,
  activeBookings,
  bookingsForClient,
  closureConflicts,
} from './lib/schedule.ts';
export type { ScheduleBooking, DateRange, AvailabilityOptions } from './lib/schedule.ts';
export { canComplete } from './lib/booking-status.ts';
export { monthDates, weekDates, adjacentMonth } from './lib/calendar.ts';
