import EmblaCarousel, { type EmblaOptionsType } from 'embla-carousel';

export type { EmblaCarouselType } from 'embla-carousel';

export function createLoopCarousel(viewport: HTMLElement, options: EmblaOptionsType = {}) {
  return EmblaCarousel(viewport, {
    align: 'start',
    loop: true,
    slidesToScroll: 1,
    skipSnaps: false,
    duration: 25,
    ...options,
  });
}
