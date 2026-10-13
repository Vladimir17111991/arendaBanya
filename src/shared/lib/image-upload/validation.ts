const imageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
]);
type ImageFile = Pick<File, 'name' | 'type' | 'size'>;
export function isHeicImage(file: ImageFile) {
  return /^image\/hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}
export function validateImageFile(file: ImageFile): string {
  const extensionOnly =
    (!file.type || file.type === 'application/octet-stream') &&
    /\.(jpe?g|png|webp|avif|hei[cf])$/i.test(file.name);
  if (!imageTypes.has(file.type.toLowerCase()) && !extensionOnly)
    return 'Выберите фото JPEG, PNG, WebP, AVIF или HEIC/HEIF.';
  if (!file.size) return 'Файл пустой. Выберите другую фотографию.';
  if (file.size > 20 * 1024 * 1024) return 'Размер каждого фото — до 20 МБ.';
  return '';
}
