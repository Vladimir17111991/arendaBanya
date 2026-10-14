import type { Client, Profile, Service } from '../model/types.ts';

export const services: Service[] = [
  {
    id: 1,
    name: 'Баня по часам',
    category: 'Почасовая аренда',
    categoryId: 1,
    rentalUnit: 'hour',
    duration: 60,
    price: 20,
    description: 'Выберите удобное время и длительность отдыха. Бронь подтверждается по телефону.',
    details: {
      forWhom: 'Для отдыха в бане на несколько часов.',
      includes: 'Аренда бани на согласованное время.',
      preparation: 'Стоимость, количество гостей и детали отдыха уточните при звонке.',
    },
  },
  {
    id: 2,
    name: 'Баня со спальней',
    category: 'Посуточная аренда',
    categoryId: 2,
    rentalUnit: 'day',
    duration: 1440,
    price: 80,
    description: 'Отдых с ночёвкой: баня и спальня на одни или несколько суток.',
    details: {
      forWhom: 'Для тех, кто хочет остаться с ночёвкой.',
      includes: 'Баня и спальня на согласованный срок.',
      preparation: 'Время заезда и выезда, стоимость и условия проживания согласуйте по телефону.',
    },
  },
];

export const profiles: Profile[] = [
  { id: 'guest', name: 'Посетитель', role: 'guest' },
  { id: 'victoria', name: 'Виктория', role: 'admin' },
];

export function createDemoClients(): Client[] {
  return [];
}

export const weekdays = [
  { id: 1, name: 'Пн' },
  { id: 2, name: 'Вт' },
  { id: 3, name: 'Ср' },
  { id: 4, name: 'Чт' },
  { id: 5, name: 'Пт' },
  { id: 6, name: 'Сб' },
  { id: 0, name: 'Вс' },
];
