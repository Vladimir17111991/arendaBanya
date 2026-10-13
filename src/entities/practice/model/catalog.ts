import { readonly, ref } from 'vue';
import { services as demoServices } from '../config/demo.ts';
import type { Category, ServiceDraft, WorkPhoto } from './types.ts';

export function createCatalog(requireAdmin: () => void, initialPhotos: readonly WorkPhoto[] = []) {
  const categories = ref<Category[]>(
    Array.from(
      new Map(
        demoServices.map((item) => [item.categoryId, { id: item.categoryId, name: item.category }]),
      ).values(),
    ),
  );
  const services = ref(
    demoServices.map((item) => ({
      ...item,
      details: item.details ? { ...item.details } : undefined,
    })),
  );
  const photos = ref<WorkPhoto[]>(initialPhotos.map((photo) => ({ ...photo })));
  let nextCategoryId = Math.max(...categories.value.map((item) => item.id)) + 1;
  let nextServiceId = Math.max(...services.value.map((item) => item.id)) + 1;
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
  const comparison = (value: string) => normalize(value).toLocaleLowerCase('ru');

  function categoryName(name: string, id?: number) {
    const value = normalize(name);
    if (!value || value.length > 50) throw new Error('Название категории — от 1 до 50 символов.');
    if (
      categories.value.some((item) => item.id !== id && comparison(item.name) === comparison(value))
    )
      throw new Error('Категория с таким названием уже есть.');
    return value;
  }
  function addCategory(name: string) {
    requireAdmin();
    const category = { id: nextCategoryId, name: categoryName(name) };
    nextCategoryId += 1;
    categories.value.push(category);
    return category;
  }
  function renameCategory(id: number, name: string) {
    requireAdmin();
    const category = categories.value.find((item) => item.id === id);
    if (!category) throw new Error('Категория не найдена.');
    category.name = categoryName(name, id);
    services.value
      .filter((item) => item.categoryId === id)
      .forEach((item) => {
        item.category = category.name;
      });
  }
  function removeCategory(id: number, moveToId?: number) {
    requireAdmin();
    if (!categories.value.some((item) => item.id === id)) throw new Error('Категория не найдена.');
    const affected = services.value.filter((item) => item.categoryId === id);
    const destination = categories.value.find((item) => item.id === moveToId && item.id !== id);
    if (affected.length && !destination)
      throw new Error(
        'Выберите другую категорию для переноса вариантов аренды. Фото и брони сохранятся.',
      );
    if (destination)
      affected.forEach((item) => {
        item.categoryId = destination.id;
        item.category = destination.name;
      });
    categories.value = categories.value.filter((item) => item.id !== id);
  }
  function validateService(draft: ServiceDraft, id?: number) {
    const category = categories.value.find((item) => item.id === draft.categoryId);
    if (!category) throw new Error('Выберите категорию из списка.');
    const name = normalize(draft.name);
    if (!name || name.length > 80)
      throw new Error('Название варианта аренды — от 1 до 80 символов.');
    if (
      services.value.some(
        (item) =>
          item.id !== id &&
          item.categoryId === category.id &&
          comparison(item.name) === comparison(name),
      )
    )
      throw new Error('В этой категории уже есть такой вариант аренды.');
    const description = draft.description.trim();
    if (description.length > 400) throw new Error('Описание — до 400 символов.');
    const details = draft.details
      ? {
          forWhom: draft.details.forWhom.trim(),
          includes: draft.details.includes.trim(),
          preparation: draft.details.preparation.trim(),
        }
      : undefined;
    if (details && Object.values(details).some((value) => value.length > 500))
      throw new Error('Каждое подробное описание — до 500 символов.');
    const { price, duration } = draft;
    const rentalUnit = draft.rentalUnit ?? 'hour';
    if (rentalUnit !== 'hour' && rentalUnit !== 'day')
      throw new Error('Выберите почасовую или посуточную аренду.');
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 10000 ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.00001
    )
      throw new Error('Укажите цену от 0 до 10 000 BYN, до двух знаков после запятой.');
    if (rentalUnit === 'day') {
      if (
        !Number.isInteger(duration) ||
        duration < 1440 ||
        duration > 43200 ||
        duration % 1440 !== 0
      )
        throw new Error('Длительность посуточной аренды — от 1 до 30 полных суток.');
    } else if (
      !Number.isInteger(duration) ||
      duration < 15 ||
      duration > 1440 ||
      duration % 15 !== 0
    ) {
      throw new Error('Длительность — от 15 до 1440 минут, с шагом 15 минут.');
    }
    return {
      name,
      description,
      details,
      categoryId: category.id,
      category: category.name,
      price,
      duration,
      rentalUnit,
    };
  }
  function addService(draft: ServiceDraft) {
    requireAdmin();
    const service = { ...validateService(draft), id: nextServiceId };
    nextServiceId += 1;
    services.value.push(service);
    return service;
  }
  function editService(id: number, draft: ServiceDraft) {
    requireAdmin();
    const service = services.value.find((item) => item.id === id);
    if (!service) throw new Error('Вариант аренды не найден.');
    Object.assign(service, validateService(draft, id));
  }
  function updateService(id: number, price: number, duration: number) {
    requireAdmin();
    const service = services.value.find((item) => item.id === id);
    if (!service) throw new Error('Вариант аренды не найден.');
    editService(id, { ...service, price, duration });
  }
  function removeService(id: number, movePhotosToId?: number) {
    requireAdmin();
    if (!services.value.some((item) => item.id === id))
      throw new Error('Вариант аренды не найден.');
    const affected = photos.value.filter((item) => item.serviceId === id);
    const destination = services.value.find((item) => item.id === movePhotosToId && item.id !== id);
    if (affected.length && !destination)
      throw new Error(
        'У варианта аренды есть фото. Перенесите их к другому варианту или сначала уберите из галереи.',
      );
    if (destination)
      affected.forEach((item) => {
        item.serviceId = destination.id;
      });
    services.value = services.value.filter((item) => item.id !== id);
  }
  function addPhoto(photo: Omit<WorkPhoto, 'id'>) {
    requireAdmin();
    if (!services.value.some((item) => item.id === photo.serviceId))
      throw new Error('Выберите вариант аренды из списка.');
    if (!photo.title.trim() || photo.title.trim().length > 100)
      throw new Error('Добавьте подпись к фото, до 100 символов.');
    if (!photo.url.startsWith('blob:')) throw new Error('Выберите фотографию с устройства.');
    if (photo.beforeUrl && !photo.beforeUrl.startsWith('blob:'))
      throw new Error('Выберите фото «до» с устройства.');
    if ((photo.comparisonNote?.trim().length ?? 0) > 180)
      throw new Error('Подпись к сравнению — до 180 символов.');
    photos.value.unshift({
      ...photo,
      title: photo.title.trim(),
      comparisonNote: photo.comparisonNote?.trim(),
      id: crypto.randomUUID(),
    });
  }
  function releasePhoto(photo: WorkPhoto) {
    for (const url of new Set([photo.url, photo.beforeUrl])) {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    }
  }
  function removePhoto(id: string) {
    requireAdmin();
    const photo = photos.value.find((item) => item.id === id);
    if (!photo) return;
    releasePhoto(photo);
    photos.value = photos.value.filter((item) => item.id !== id);
  }
  function dispose() {
    photos.value.forEach(releasePhoto);
  }
  return {
    categories: readonly(categories),
    services: readonly(services),
    photos: readonly(photos),
    addCategory,
    renameCategory,
    removeCategory,
    addService,
    editService,
    updateService,
    removeService,
    addPhoto,
    removePhoto,
    dispose,
  };
}
