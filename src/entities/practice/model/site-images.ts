import { readonly, ref } from 'vue';
import type { SiteImage, SiteImageSlot } from './types.ts';

export function createSiteImages(
  requireAdmin: () => void,
  initial: Partial<Record<SiteImageSlot, SiteImage>> = {},
) {
  const siteImages = ref<Record<SiteImageSlot, SiteImage | null>>({
    hero: initial.hero ? { ...initial.hero } : null,
    studio: initial.studio ? { ...initial.studio } : null,
  });
  function release(image: SiteImage | null) {
    if (image?.url.startsWith('blob:')) URL.revokeObjectURL(image.url);
  }
  function setSiteImage(slot: SiteImageSlot, image: SiteImage) {
    requireAdmin();
    if (!image.url.startsWith('blob:')) throw new Error('Выберите фотографию с устройства.');
    if (![image.width, image.height].every((size) => Number.isInteger(size) && size > 0))
      throw new Error('Не удалось определить размер фотографии.');
    const previous = siteImages.value[slot];
    siteImages.value[slot] = { url: image.url, width: image.width, height: image.height };
    if (previous?.url !== image.url) release(previous);
  }
  function removeSiteImage(slot: SiteImageSlot) {
    requireAdmin();
    release(siteImages.value[slot]);
    siteImages.value[slot] = null;
  }
  function dispose() {
    release(siteImages.value.hero);
    release(siteImages.value.studio);
    siteImages.value = { hero: null, studio: null };
  }
  return { siteImages: readonly(siteImages), setSiteImage, removeSiteImage, dispose };
}
