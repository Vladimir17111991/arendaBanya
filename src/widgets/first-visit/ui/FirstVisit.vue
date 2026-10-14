<template>
  <section class="first-visit content-section container" aria-labelledby="first-visit-title">
    <div class="row gy-4 gx-lg-5">
      <div class="col-lg-5">
        <h2 id="first-visit-title" class="section-heading__title mb-3">
          Договоримся<br /><em class="section-heading__accent">обо всём.</em>
        </h2>
        <p class="first-visit__intro">
          Несколько ответов перед бронированием. Остальные детали можно уточнить по телефону.
        </p>
      </div>
      <div class="col-lg-7">
        <details v-for="item in questions" :key="item.question" class="first-visit__item">
          <summary class="first-visit__question">
            {{ item.question }}<span class="first-visit__plus" aria-hidden="true">＋</span>
          </summary>
          <p class="first-visit__answer">{{ item.answer }}</p>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const questions = [
  {
    question: 'Как забронировать баню?',
    answer:
      'Выберите формат отдыха, число гостей и даты в календаре, затем позвоните. Доступное время можно посмотреть по нажатию на дату, а точное начало согласовать по телефону. Бронь считается согласованной после подтверждения по телефону.',
  },
  {
    question: 'Можно остаться на сутки?',
    answer:
      'Да, предусмотрена посуточная аренда со спальней. Время заезда и выезда, количество гостей и стоимость согласуйте при бронировании.',
  },
  {
    question: 'Как рассчитывается стоимость?',
    answer:
      'Тариф за одного гостя умножается на количество гостей и часов или суток. Например, с 13-го по 15-е число — двое суток. В календаре видны ставка и итог для всей компании. Сейчас на сайте указаны тестовые тарифы; окончательную стоимость уточните при бронировании.',
  },
  {
    question: 'Сколько гостей может приехать и остаться на ночь?',
    answer:
      'При звонке уточните вместимость бани и число спальных мест. Сообщите, сколько будет взрослых и детей. Возможность приехать с детьми или питомцами обсудите заранее.',
  },
  {
    question: 'Что входит в аренду и что взять с собой?',
    answer:
      'Для почасового отдыха предусмотрена аренда бани, для посуточного — баня со спальней. Уточните, предоставляются ли полотенца, банные принадлежности и постельное бельё, а также что можно привезти из еды и напитков.',
  },
  {
    question: 'Нужна ли предоплата?',
    answer:
      'Способ оплаты, необходимость и размер предоплаты согласуйте до подтверждения брони. Сайт не принимает оплату.',
  },
  {
    question: 'Как перенести или отменить бронь?',
    answer:
      'Если планы изменились, позвоните как можно раньше. Возможность переноса и условия отмены обсуждаются лично при бронировании.',
  },
];
</script>

<style scoped>
.first-visit__intro {
  color: var(--muted);
  line-height: 1.8;
  font-size: 16px;
  max-width: 380px;
}
.first-visit__link {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  min-height: 52px;
  color: var(--brand);
  background: var(--control-bg);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px 20px;
  font-size: 16px;
  text-decoration: none;
}
.first-visit__link:hover {
  color: var(--selected-text);
  background: var(--selected-bg);
}
.first-visit__item {
  margin-bottom: 12px;
  padding-inline: 22px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: #21132fc4;
}
.first-visit__question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 22px 0;
  list-style: none;
  font-size: 18px;
  line-height: 1.5;
  font-weight: 500;
}
.first-visit__question::-webkit-details-marker {
  display: none;
}
.first-visit__plus {
  color: var(--accent);
  font-size: 23px;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.first-visit__item[open] .first-visit__plus {
  transform: rotate(45deg);
}
.first-visit__answer {
  margin: 0 0 22px;
  font-size: 16px;
  line-height: 1.85;
  color: var(--muted);
}
@media (prefers-reduced-motion: reduce) {
  .first-visit__plus {
    transition: none;
  }
}
</style>
