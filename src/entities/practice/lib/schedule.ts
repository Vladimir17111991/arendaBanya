import type { Booking, BookingStatus, ClosedPeriod, Service } from '../model/types.ts';

export type ScheduleBooking = Pick<Booking, 'date' | 'time' | 'clientId' | 'status'> & {
  service: { duration: number };
};
type BookingInterval = Pick<ScheduleBooking, 'date' | 'time' | 'service'>;
export type DateRange = Pick<ClosedPeriod, 'start' | 'end'>;
export interface AvailabilityOptions {
  date: string;
  duration: number;
  rentalUnit?: Service['rentalUnit'];
  bookings: readonly ScheduleBooking[];
  daysOff: readonly number[];
  breaks: readonly DateRange[];
  now?: Date;
}

export const HOURS = { start: 600, end: 1140, step: 30 };
export const BOOKING_HORIZON_DAYS = 90;
const DAY_MINUTES = 1440;
const MINUTE_MS = 60_000;
// The prototype uses the existing UTC+03:00 business timezone throughout.
const OFFSET_MINUTES = 180;
export function todayKey(now = new Date()) {
  return new Date(now.getTime() + OFFSET_MINUTES * MINUTE_MS).toISOString().slice(0, 10);
}
export function isDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const value = new Date(`${key}T12:00:00Z`);
  return Number.isFinite(value.getTime()) && value.toISOString().slice(0, 10) === key;
}
export function addDays(key: string, amount: number): string {
  const value = new Date(`${key}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
export const weekday = (key: string): number => new Date(`${key}T12:00:00Z`).getUTCDay();
export const minutes = (time: string): number =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const formatTime = (value: number): string =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
export const isClosed = (
  date: string,
  daysOff: readonly number[],
  breaks: readonly DateRange[],
): boolean =>
  daysOff.includes(weekday(date)) || breaks.some((item) => item.start <= date && date <= item.end);
export const activeBookings = <T extends { status: BookingStatus }>(bookings: readonly T[]): T[] =>
  bookings.filter((item) => item.status === 'confirmed');
export const bookingsForClient = <T extends { clientId: string }>(
  bookings: readonly T[],
  clientId: string | undefined,
): T[] => bookings.filter((item) => item.clientId === clientId);

export function bookingEnd(booking: BookingInterval): { date: string; time: string } {
  const endMinutes = minutes(booking.time) + booking.service.duration;
  return {
    date: addDays(booking.date, Math.floor(endMinutes / DAY_MINUTES)),
    time: formatTime(endMinutes % DAY_MINUTES),
  };
}

// Intervals are half-open: checkout at 10:00 permits the next arrival at 10:00.
export function bookingDates(booking: BookingInterval): string[] {
  const finalDay = Math.floor((minutes(booking.time) + booking.service.duration - 1) / DAY_MINUTES);
  return Array.from({ length: finalDay + 1 }, (_, index) => addDays(booking.date, index));
}

function interval(booking: BookingInterval): { start: number; end: number } {
  const start = new Date(`${booking.date}T${booking.time}:00+03:00`).getTime();
  return { start, end: start + booking.service.duration * MINUTE_MS };
}

export function freeSlots({
  date,
  duration,
  rentalUnit = 'hour',
  bookings,
  daysOff,
  breaks,
  now = new Date(),
}: AvailabilityOptions): string[] {
  const today = todayKey(now);
  const horizon = addDays(today, BOOKING_HORIZON_DAYS);
  if (
    !isDateKey(date) ||
    date < today ||
    date >= horizon ||
    !Number.isInteger(duration) ||
    duration <= 0 ||
    duration > 30 * DAY_MINUTES ||
    isClosed(date, daysOff, breaks)
  )
    return [];
  const occupied = bookings.filter((item) => item.status !== 'cancelled').map(interval);
  const horizonEnd = new Date(`${horizon}T00:00:00+03:00`).getTime();
  const slots: string[] = [];
  for (let start = HOURS.start; start < HOURS.end; start += HOURS.step) {
    if (rentalUnit !== 'day' && start + duration > HOURS.end) continue;
    const time = formatTime(start);
    const candidate = { date, time, service: { duration } };
    const range = interval(candidate);
    if (range.start <= now.getTime() || range.end > horizonEnd) continue;
    if (bookingDates(candidate).some((key) => isClosed(key, daysOff, breaks))) continue;
    if (occupied.some((item) => range.start < item.end && range.end > item.start)) continue;
    slots.push(time);
  }
  return slots;
}

// Closing a date must also detect an overnight booking that began earlier.
export function closureConflicts<T extends ScheduleBooking>(
  bookings: readonly T[],
  predicate: (date: string) => boolean,
  today: string,
): T[] {
  return activeBookings(bookings).filter((item) =>
    bookingDates(item).some((date) => date >= today && predicate(date)),
  );
}
