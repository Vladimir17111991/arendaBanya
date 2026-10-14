import type { SiteImage, SiteImageSlot } from '../../entities/practice/index.ts';

export const demoSiteImages: Partial<Record<SiteImageSlot, SiteImage>> = {
  hero: {
    url: './images/bathhouse/pexels-7598370.jpg',
    width: 1200,
    height: 801,
    isDemo: true,
  },
  studio: {
    url: './images/bathhouse/pexels-7598370.jpg',
    width: 1200,
    height: 801,
    isDemo: true,
  },
};
