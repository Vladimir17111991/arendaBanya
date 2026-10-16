import type { Booking } from '../model/types.ts';
import { bookingEnd } from './schedule.ts';

export function canComplete(booking: Booking, now: Date): boolean {
  const end = bookingEnd(booking);
  return booking.status === 'confirmed' && new Date(`${end.date}T${end.time}:00+03:00`) <= now;
}
