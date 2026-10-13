import type { Service } from '../model/types.ts';

// Input limit for this prototype, not the property's advertised capacity.
export const MAX_GUESTS = 30;

// Catalog prices are per guest and rental unit. Booking service snapshots hold totals.
// An incomplete form has no quoted total; prepareBooking separately rejects invalid input.
export function rentalPrice(service: Pick<Service, 'price'>, quantity = 1, guestCount = 1): number {
  if (
    !Number.isFinite(service.price) ||
    service.price < 0 ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    !Number.isInteger(guestCount) ||
    guestCount < 1 ||
    guestCount > MAX_GUESTS
  )
    return 0;
  return (Math.round(service.price * 100) * quantity * guestCount) / 100;
}
