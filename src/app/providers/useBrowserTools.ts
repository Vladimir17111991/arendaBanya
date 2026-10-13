import { nextTick, onMounted, onUnmounted } from 'vue';
import type { PracticeStore } from '../../entities/practice/index.ts';
import type { Navigation } from '../../shared/routing/index.ts';

interface ModelContext {
  registerTool(
    tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean };
      execute(input: unknown): Promise<{ status: string; service: string }>;
    },
    options: { signal: AbortSignal },
  ): void | Promise<void>;
}

export function useBrowserTools(store: PracticeStore, navigation: Navigation) {
  const lifecycle = new AbortController();
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    store.refreshClock();
    timer = setInterval(store.refreshClock, 30_000);
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'start_demo_booking',
            description:
              'Открыть форму ручной демо-записи в кабинете Виктории. Запись не создаётся.',
            inputSchema: {
              type: 'object',
              properties: {
                serviceId: { type: 'integer' },
              },
              required: ['serviceId'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            async execute(input: unknown) {
              const serviceId =
                input && typeof input === 'object' && 'serviceId' in input
                  ? input.serviceId
                  : undefined;
              const service = store.services.value.find((item) => item.id === serviceId);
              if (!service) throw new Error('Неизвестная аренда');
              if (!store.isAdmin.value)
                throw new Error('Ручная запись доступна только в демо-кабинете Виктории');
              store.selectService(service);
              navigation.navigate('booking', { reset: true });
              await nextTick();
              return { status: 'form_opened', service: service.name };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional browser capability. */
      });
    } catch {
      /* Optional browser capability. */
    }
  });
  onUnmounted(() => {
    clearInterval(timer);
    lifecycle.abort();
  });
}
