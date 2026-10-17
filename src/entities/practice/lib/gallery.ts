import type { Category } from '../model/types.ts';

export function galleryCategoryLabel(category: Category): string {
  if (category.name === 'Почасовая аренда') return 'Баня';
  if (category.name === 'Посуточная аренда') return 'Спальня';
  return category.name;
}

export function groupGalleryPhotos<T extends { categoryIds: readonly number[] }>(
  categories: readonly Category[],
  photos: readonly T[],
) {
  return categories.map((category) => ({
    id: category.id,
    label: galleryCategoryLabel(category),
    photos: photos.filter((photo) => photo.categoryIds.includes(category.id)),
  }));
}

export function sortGalleryPhotos<T extends { categoryIds: readonly number[] }>(
  categories: readonly Category[],
  photos: readonly T[],
): T[] {
  const rank = (photo: T) => {
    const index = categories.findIndex((category) => photo.categoryIds.includes(category.id));
    return index < 0 ? categories.length : index;
  };
  return [...photos].sort((left, right) => rank(left) - rank(right));
}
