import { addDays, freeSlots, isDateKey, todayKey, type DateRange } from './schedule.ts';
import { MAX_GUESTS, rentalPrice } from './pricing.ts';

import type { Booking, BookingDraft, Client, Profile } from '../model/types.ts';

export interface PrepareBookingOptions extends BookingDraft {
  actor: Pick<Profile, 'id' | 'role'> | null;
  clients: readonly Client[];
  bookings: readonly Booking[];
  daysOff: readonly number[];
  breaks: readonly DateRange[];
  now?: Date;
  makeId?: () => string;
}

export function normalizePhone(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function findClientByPhone(clients: readonly Client[], phone: string): Client | undefined {
  const normalized = normalizePhone(phone);
  return normalized
    ? clients.find((client) => normalizePhone(client.phone) === normalized)
    : undefined;
}

export function matchesClient(client: Client, query: string): boolean {
  const text = query.trim().toLocaleLowerCase('ru');
  const digits = normalizePhone(query);
  return (
    !text ||
    client.name.toLocaleLowerCase('ru').includes(text) ||
    (digits.length > 0 && normalizePhone(client.phone).includes(digits))
  );
}

export function prepareClient(
  clients: readonly Client[],
  nameValue: string,
  phoneValue: string,
): Client {
  const name = String(nameValue ?? '').trim();
  const rawPhone = String(phoneValue ?? '').trim();
  const phone = normalizePhone(rawPhone);
  if (!name || name.length > 60) throw new Error('Укажите имя клиента, до 60 символов.');
  if (!/^[+\d\s().-]+$/.test(rawPhone) || !/^375\d{9}$/.test(phone))
    throw new Error('Укажите телефон в формате +375 и 9 цифр номера.');
  if (findClientByPhone(clients, phone))
    throw new Error('Клиент с таким телефоном уже есть. Выберите его из базы.');
  return { id: '', name, phone: `+${phone}`, accountId: null, reminderChannel: null };
}

// Demo-only business rules. The production API must obtain the actor from a
// server session and check availability and insert within one DB transaction.
// No state is mutated until all validation passes, including for a new client.
export function prepareBooking({
  actor,
  clients,
  bookings,
  service,
  quantity = 1,
  guestCount = 1,
  date,
  time,
  daysOff,
  breaks,
  customer,
  reminder,
  now = new Date(),
  makeId = () => crypto.randomUUID(),
}: PrepareBookingOptions): { booking: Booking; newClient: Client | null } {
  if (!actor || actor.role !== 'admin')
    throw new Error('Бронь добавляет Виктория в своём кабинете после звонка.');
  let client: Client;
  let newClient: Client | null = null;

  if (customer?.mode === 'existing') {
    const existing = clients.find((item) => item.id === customer.clientId);
    if (!existing) throw new Error('Выберите клиента из списка.');
    client = existing;
  } else if (customer?.mode === 'new') {
    newClient = prepareClient(clients, customer.name, customer.phone);
    client = newClient;
  } else {
    throw new Error('Выберите клиента или добавьте нового.');
  }

  const today = todayKey(now);
  if (!isDateKey(date || '') || date < today || date >= addDays(today, 90))
    throw new Error('Выберите дату в ближайшие 90 дней.');
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > (service?.rentalUnit === 'day' ? 30 : 24)
  )
    throw new Error('Укажите целое число часов от 1 до 24 или суток от 1 до 30.');
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > MAX_GUESTS)
    throw new Error(`Укажите целое число гостей от 1 до ${MAX_GUESTS}.`);
  const duration = service?.duration * quantity;
  if (
    !service ||
    !freeSlots({
      date,
      duration,
      rentalUnit: service.rentalUnit,
      bookings,
      daysOff,
      breaks,
      now,
    }).includes(time)
  ) {
    throw new Error('Это время уже недоступно. Выберите другое.');
  }

  if (newClient) newClient.id = makeId();
  return {
    newClient,
    booking: {
      id: makeId(),
      clientId: client.id,
      service: {
        ...service,
        duration,
        price: rentalPrice(service, quantity, guestCount),
        details: service.details ? { ...service.details } : undefined,
      },
      quantity,
      guestCount,
      unitPrice: service.price,
      date,
      time,
      name: client.name,
      phone: client.phone,
      reminder: Boolean(reminder && client.reminderChannel),
      status: 'confirmed',
      createdBy: actor.id,
      source: 'admin',
    },
  };
}
