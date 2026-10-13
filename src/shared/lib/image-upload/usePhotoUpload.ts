import { onBeforeUnmount, ref } from 'vue';
import { validateImageFile, isHeicImage } from './validation.ts';

export function usePhotoUpload() {
  const url = ref('');
  const ready = ref(false);
  const error = ref('');
  const dimensions = ref<{ width: number; height: number } | null>(null);
  let version = 0;
  function release() {
    version += 1;
    if (url.value) URL.revokeObjectURL(url.value);
    url.value = '';
    ready.value = false;
    dimensions.value = null;
  }
  function select(event: Event) {
    release();
    error.value = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    error.value = validateImageFile(file);
    if (error.value) return;
    const selectedVersion = version;
    url.value = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (selectedVersion !== version) return;
      dimensions.value = { width: image.naturalWidth, height: image.naturalHeight };
      ready.value = true;
    };
    image.onerror = () => {
      if (selectedVersion !== version) return;
      release();
      error.value = isHeicImage(file)
        ? 'Этот браузер не открыл HEIC/HEIF. Выберите JPEG-копию из галереи телефона или экспортируйте снимок в JPEG.'
        : 'Не удалось открыть файл как фотографию. Попробуйте другой снимок.';
    };
    image.src = url.value;
  }
  function take() {
    // Ownership passes to the catalogue only after successful publication.
    version += 1;
    url.value = '';
    ready.value = false;
    dimensions.value = null;
    error.value = '';
  }
  onBeforeUnmount(release);
  return { url, ready, error, dimensions, select, release, take };
}
