<template>
  <figure class="hero-visual position-relative">
    <div class="hero-visual__halo" aria-hidden="true"></div>
    <div class="hero-visual__frame">
      <img
        v-if="image"
        class="hero-visual__image d-block w-100"
        :src="image.url"
        :alt="image.isDemo ? 'Пример интерьера бани' : 'Баня у Виктории'"
        :width="image.width"
        :height="image.height"
        fetchpriority="high"
        decoding="async"
      />
      <div
        v-else
        class="hero-visual__placeholder d-flex flex-column align-items-center justify-content-center"
      >
        <span class="hero-visual__branch" aria-hidden="true"></span>
        <span class="hero-visual__monogram" aria-hidden="true">В.</span>
        <span class="hero-visual__placeholder-title">Здесь будет фото бани</span>
        <span class="hero-visual__placeholder-note">Парная и место для отдыха</span>
      </div>
    </div>
    <figcaption class="hero-visual__caption">
      <span class="hero-visual__name">Тепло, ради которого стоит замедлиться.</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import type { SiteImage } from '../../../entities/practice/index.ts';
defineProps<{ image?: SiteImage | null }>();
</script>

<style scoped>
.hero-visual {
  width: 100%;
  margin: 0 auto;
  padding: 0;
  isolation: isolate;
}
.hero-visual__frame {
  position: relative;
  margin: 0 8px 8px 0;
  isolation: isolate;
}
.hero-visual__frame::before {
  content: '';
  position: absolute;
  inset: 8px -8px -8px 8px;
  border: 1px solid #bda18485;
  border-radius: 24px;
  background: linear-gradient(145deg, #765033, #3c352f 70%, #71573d);
  z-index: -1;
}
.hero-visual__halo {
  position: absolute;
  inset: 6% -5% 8% 4%;
  border-radius: 30%;
  background:
    radial-gradient(ellipse at 85% 15%, #d3c0ac45, transparent 62%),
    radial-gradient(ellipse at 10% 65%, #c8b0985c, transparent 64%);
  filter: blur(26px);
  z-index: -1;
}
.hero-visual__image,
.hero-visual__placeholder {
  border-radius: 24px;
  background: #352f2a;
  border: 5px solid #423b34;
  box-shadow:
    0 24px 56px -24px #151210db,
    0 0 28px -14px #d2bfac80;
}
.hero-visual__image {
  height: auto;
  object-fit: contain;
  image-orientation: from-image;
}
.hero-visual__placeholder {
  aspect-ratio: 0.8;
  position: relative;
  overflow: hidden;
  color: var(--ink);
  background:
    radial-gradient(ellipse at 20% 5%, #b4937373, transparent 75%),
    linear-gradient(145deg, #6f553c, #2e2924);
}
.hero-visual__placeholder::before {
  content: '';
  position: absolute;
  inset: 14px;
  border: 1px solid #ede8e445;
  border-radius: 16px;
}
.hero-visual__branch {
  position: absolute;
  width: 165px;
  height: 350px;
  top: -90px;
  right: -55px;
  border: 1px solid #ebe6e259;
  border-radius: 50%;
  transform: rotate(-38deg);
}
.hero-visual__branch::after {
  content: '';
  position: absolute;
  inset: 24px;
  border: 1px solid #ebe6e238;
  border-radius: 50%;
}
.hero-visual__monogram {
  font-family: var(--display);
  font-size: clamp(90px, 9vw, 130px);
  font-style: italic;
  line-height: 1.4;
}
.hero-visual__placeholder-title {
  font-size: 16px;
  text-align: center;
  padding: 0 15px;
}
.hero-visual__placeholder-note {
  margin-top: 8px;
  font-size: 14px;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.hero-visual__caption {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding-top: 22px;
}
.hero-visual__name {
  font-family: var(--display);
  font-size: 27px;
  font-style: italic;
  color: var(--brand);
}
.hero-visual__role {
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}
.hero-visual__demo {
  flex-basis: 100%;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}
@media (max-width: 575.98px) {
  .hero-visual {
    width: 100%;
  }
  .hero-visual__placeholder {
    aspect-ratio: 1.1;
  }
  .hero-visual__caption {
    padding-top: 16px;
  }
}
</style>
