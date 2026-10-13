const address = 'Беларусь, Солигорск, проспект Мира, 32Б';
const query = encodeURIComponent(address);

// Sample address supplied for the prototype; confirm before publishing.
export const practiceLocation = {
  country: 'Беларусь',
  city: 'Солигорск',
  street: 'проспект Мира, 32Б',
  isDemo: true,
  mapHref: `https://yandex.by/maps/?text=${query}`,
  routeHref: `https://yandex.by/maps/?mode=routes&rtext=~${query}&rtt=auto`,
  embedHref: `https://yandex.by/map-widget/v1/?text=${query}&z=16`,
};
