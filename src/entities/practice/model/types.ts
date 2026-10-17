export type Role = 'guest' | 'client' | 'admin';
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';
export type BookingFilter = BookingStatus | 'all';

export interface Profile {
  id: string;
  name: string;
  role: Role;
}

export interface Client {
  id: string;
  accountId: string | null;
  name: string;
  phone: string;
  reminderChannel: 'telegram' | null;
}

export interface Category {
  id: number;
  name: string;
}

export interface ServiceDetails {
  forWhom: string;
  includes: string;
  preparation: string;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  duration: number;
  rentalUnit?: 'hour' | 'day';
  price: number;
  description: string;
  details?: ServiceDetails;
}

export type ServiceDraft = Omit<Service, 'id' | 'category'>;

export interface Booking {
  id: string;
  clientId: string;
  service: Service;
  quantity?: number;
  guestCount?: number;
  unitPrice?: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  reminder: boolean;
  status: BookingStatus;
  createdBy: string;
  source: 'client' | 'admin';
}

export interface WorkPhoto {
  id: string;
  categoryIds: number[];
  title: string;
  url: string;
  isDemo?: boolean;
  objectPosition?: string;
  beforeUrl?: string;
  comparisonNote?: string;
  demoDiptych?: boolean;
}

export type PhotoDraft = Omit<WorkPhoto, 'id' | 'title'> & { title?: string };

export type SiteImageSlot = 'hero' | 'studio';
export interface SiteImage {
  url: string;
  width: number;
  height: number;
  isDemo?: boolean;
}

export interface ClosedPeriod {
  id: string;
  start: string;
  end: string;
  kind: 'Отпуск' | 'Выходной';
}

export type CustomerSelection =
  { mode: 'existing'; clientId: string } | { mode: 'new'; name: string; phone: string };

export interface BookingDraft {
  service: Service;
  quantity?: number;
  guestCount?: number;
  date: string;
  time: string;
  reminder: boolean;
  customer?: CustomerSelection;
}
