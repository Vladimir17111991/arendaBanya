<template>
  <section class="studio" aria-labelledby="studio-title">
    <div class="container studio__layout">
      <h2 id="studio-title" class="studio__title">
        На несколько часов.<br /><em>Или без спешки — на сутки.</em>
      </h2>
      <p class="studio__text">
        Баня для отдыха и спальня для тех, кто хочет остаться подольше. Виктория живёт рядом и лично
        обсуждает с гостями время, стоимость и условия аренды.
      </p>
    </div>
  </section>
</template>

<style scoped>
.studio {
  padding-block: 34px;
  border-block: 1px solid var(--line);
  background: #21132f80;
}
.studio__layout {
  display: grid;
  grid-template-columns: 0.65fr 1.1fr 1.2fr;
  align-items: center;
  gap: 40px;
}
.studio__kicker {
  max-width: 200px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}
.studio__title {
  font-family: var(--display);
  font-size: 32px;
  font-weight: 400;
  line-height: 1.3;
  margin: 0;
  letter-spacing: -0.03em;
}
.studio__title em {
  color: var(--accent);
}
.studio__text {
  margin: 0;
  font-size: 16px;
  line-height: 1.9;
  color: var(--muted);
}
@media (max-width: 991.98px) {
  .studio__layout {
    grid-template-columns: 1fr 1.2fr;
    gap: 24px;
  }
  .studio__kicker {
    grid-column: 1 / -1;
    max-width: none;
  }
}
@media (max-width: 575.98px) {
  .studio__layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .studio__title {
    font-size: 30px;
  }
}
</style>
