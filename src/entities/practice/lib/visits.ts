import type { Booking, Client } from '../model/types.ts';
import { bookingEnd } from './schedule.ts';

export function completedVisits(client: Client, bookings: readonly Booking[]): number {
  return (
    (client.previousVisits ?? 0) +
    bookings.filter((item) => item.clientId === client.id && item.status === 'completed').length
  );
}
export function visitNumber(
  client: Client,
  booking: Booking,
  bookings: readonly Booking[],
): number {
  const moment = `${booking.date}T${booking.time}`;
  return (
    (client.previousVisits ?? 0) +
    1 +
    bookings.filter(
      (item) =>
        item.clientId === client.id &&
        item.status === 'completed' &&
        item.id !== booking.id &&
        `${item.date}T${item.time}` < moment,
    ).length
  );
}
export function canComplete(booking: Booking, now: Date): boolean {
  const end = bookingEnd(booking);
  return booking.status === 'confirmed' && new Date(`${end.date}T${end.time}:00+03:00`) <= now;
}
