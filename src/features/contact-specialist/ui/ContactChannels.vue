<template>
  <div class="contact-channels">
    <div class="contact-channels__icons" aria-label="Социальные сети и мессенджеры">
      <button
        v-for="channel in channels"
        :key="channel"
        type="button"
        class="contact-channels__button"
        :aria-label="channel"
        :title="channel"
        @click="notice = 'Ссылка на ' + channel + ' появится после подключения контактов.'"
      >
        <svg
          v-if="channel === 'Instagram'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          aria-hidden="true"
        >
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
        <svg
          v-else-if="channel === 'Telegram'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="m3 10.3 17.3-6.5c.7-.3 1 .1.8.8l-3 15c-.1.7-.6.9-1.2.5l-5-3.7-2.5 2.4.5-5.3 8.2-7-10.4 6-4.6-1.4c-.8-.3-.8-.6-.1-.8Z"
          />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M19.6 3.7C16.5 1.9 7.2 2 4.3 4.2 1.6 6.3 2.3 14.4 4 17c.7 1 1.8 1.6 3.1 1.9V22l3.4-3c3.1.2 6.9-.1 8.7-1.4 2.9-2.2 3-11.9.4-13.9Z"
          />
          <path
            d="m7.1 7.4 1.5-.4 1.5 2.6-.9 1.1a8.7 8.7 0 0 0 3.6 3.6l1.2-.9 2.5 1.5-.4 1.4c-.3.9-1.1 1-2 .7-3.7-1.1-6.3-3.7-7.6-7.4-.3-1-.3-1.8.6-2.2ZM13 5.8a5.2 5.2 0 0 1 5.2 5.2M13.3 8.4a2.4 2.4 0 0 1 2.4 2.4"
          />
        </svg>
      </button>
    </div>
    <p v-if="notice" class="contact-channels__notice" role="status">{{ notice }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const channels = ['Instagram', 'Telegram', 'Viber'] as const;
const notice = ref('');
</script>

<style scoped>
.contact-channels__icons {
  display: flex;
  align-items: center;
  gap: 12px;
}
.contact-channels__button {
  display: grid;
  place-items: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--brand);
  background: var(--control-bg);
  transition:
    background-color 180ms,
    border-color 180ms,
    transform 180ms;
}
.contact-channels__button svg {
  width: 25px;
  height: 25px;
}
.contact-channels__button:hover {
  border-color: var(--accent);
  background: var(--selected-bg);
  transform: translateY(-2px);
}
.contact-channels__notice {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}
@media (prefers-reduced-motion: reduce) {
  .contact-channels__button {
    transition: none;
  }
}
</style>
