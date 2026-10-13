<template>
  <section class="mx-auto py-5 access-view__content">
    <div
      class="mb-4 grid align-items-center justify-content-center rounded-pill bg-primary-subtle fs-4 access-view__icon"
      aria-hidden="true"
    >
      ♡
    </div>
    <p class="section-heading__kicker">ЛИЧНОЕ ЗНАКОМСТВО</p>
    <h1 class="display-title">Запись по приглашению Виктории</h1>
    <p class="mt-4 text-body-secondary">
      Виктория сама добавляет клиентов и открывает им доступ к записи. Самостоятельной регистрации
      на сайте нет.
    </p>
    <ol class="my-4 d-flex flex-column gap-3 small">
      <li><strong>01.</strong> Свяжитесь с Викторией привычным способом.</li>
      <li><strong>02.</strong> После знакомства она добавит вас в список клиентов.</li>
      <li><strong>03.</strong> С доступом в кабинет вы сможете выбрать свободное время.</li>
    </ol>
    <BaseButton @click="navigate('price')">Посмотреть прайс-лист</BaseButton>
    <p class="mt-4 rounded-4 border bg-white p-3 small text-body-secondary">
      В этом прототипе вход можно посмотреть через «Демо-профиль» сверху. Проверка телефона и
      отправка приглашений ещё не подключены.
    </p>
  </section>
</template>

<script setup lang="ts">
import { BaseButton } from '../../../shared/ui/index.ts';
import { useNavigation } from '../../../shared/routing/index.ts';
const { navigate } = useNavigation();
</script>

<style scoped>
.access-view__content {
  max-width: 36rem;
}
@media (min-width: 768px) {
  .access-view__content {
    padding-block: 5rem;
  }
}
.access-view__icon {
  width: 3.5rem;
  height: 3.5rem;
}
</style>
