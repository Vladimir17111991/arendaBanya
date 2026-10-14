<template>
  <div class="contact-form">
    <div class="contact-form__channels" aria-label="Социальные сети и мессенджеры">
      <button
        v-for="channel in ['Instagram', 'Telegram', 'Viber']"
        :key="channel"
        type="button"
        class="contact-form__channel"
        @click="notice = 'Ссылка на ' + channel + ' появится после подключения контактов.'"
      >
        {{ channel }}
      </button>
    </div>

    <form @submit.prevent="submit">
      <div class="contact-form__fields">
        <label
          >Ваше имя<input
            v-model="name"
            class="form-control"
            autocomplete="name"
            maxlength="60"
            required
            placeholder="Как к вам обращаться"
        /></label>
        <label>Телефон<PhoneInput v-model="phone" class="form-control" required /></label>
      </div>
      <label class="contact-form__message"
        >Ваш вопрос<textarea
          v-model="message"
          class="form-control"
          rows="3"
          maxlength="1500"
          required
          placeholder="Даты отдыха, количество гостей или ваш вопрос"
        />
      </label>
      <button type="submit" class="btn btn-primary contact-form__submit">Отправить запрос</button>
      <p v-if="notice" role="status" class="contact-form__notice">{{ notice }}</p>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { PhoneInput } from '../../../shared/ui/index.ts';
const props = defineProps<{ initialMessage?: string }>();
const name = ref('');
const phone = ref('');
const message = ref('');
const notice = ref('');
watch(
  () => props.initialMessage,
  (value) => {
    message.value = value?.includes('Хочу забронировать баню:') ? value : '';
    notice.value = '';
  },
);
function submit() {
  notice.value = 'Отправка ещё не подключена. Ваш запрос не отправлен.';
}
</script>
<style scoped>
.contact-form {
  display: grid;
  gap: 28px;
}
.contact-form form {
  display: grid;
  gap: 22px;
}
.contact-form__channels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.contact-form__channel {
  min-height: 48px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink);
  background: var(--control-bg);
  font-size: 15px;
}
.contact-form__channel:hover {
  border-color: var(--accent);
}
.contact-form__hint {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  margin: 16px 0 24px;
}
.contact-form__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.contact-form label {
  display: grid;
  gap: 8px;
  min-width: 0;
  font-size: 15px;
}
.contact-form .form-control {
  background: var(--control-bg);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px 14px;
  min-height: 48px;
}
.contact-form .form-control::placeholder {
  color: var(--muted);
}
.contact-form textarea {
  resize: vertical;
}
.contact-form__message {
  margin: 0;
}
.contact-form__submit {
  margin: 2px 0 0;
}
.contact-form__notice {
  margin: 16px 0 0;
  line-height: 1.6;
  color: var(--accent);
}
@media (max-width: 575.98px) {
  .contact-form__fields {
    grid-template-columns: 1fr;
  }
  .contact-form__channels {
    gap: 6px;
  }
  .contact-form__channel {
    font-size: 13px;
  }
}
</style>
