import { addDays, weekday } from './schedule.ts';

export function weekDates(date: string): string[] {
  const monday = addDays(date, -((weekday(date) + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function monthDates(date: string): string[] {
  const start = weekDates(`${date.slice(0, 7)}-01`)[0]!;
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function adjacentMonth(date: string, delta: number): string {
  const value = new Date(`${date.slice(0, 7)}-01T12:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + delta);
  return value.toISOString().slice(0, 10);
}
