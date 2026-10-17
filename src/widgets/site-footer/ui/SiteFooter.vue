<template>
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__columns">
        <SectionLink to="home" class="site-footer__brand" aria-label="Баня у Виктории — главная">
          <span class="site-footer__mark" aria-hidden="true">В.</span>
          <span>Виктория<small>БАНЯ И ОТДЫХ</small></span>
        </SectionLink>
        <nav class="site-footer__column" aria-label="Навигация внизу страницы">
          <h2>Навигация</h2>
          <SectionLink
            v-for="link in links"
            :key="link.section"
            :to="link.section"
            :aria-current="activeSection === link.section ? 'location' : undefined"
            >{{ link.label }}</SectionLink
          >
        </nav>
        <div class="site-footer__column site-footer__address">
          <h2>Адрес</h2>
          <address>
            <span>{{ location.country }}, {{ location.city }}</span>
            <strong>{{ location.street }}</strong>
          </address>
          <a
            :href="location.mapHref"
            target="_blank"
            rel="noopener noreferrer"
            class="site-footer__text-link"
            >Открыть на карте</a
          >
        </div>
        <div class="site-footer__column site-footer__contacts">
          <h2>Контакты</h2>
          <ContactChannels />
        </div>
      </div>

      <div class="site-footer__bottom">
        <span>© {{ year }} Виктория · Баня и отдых</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ContactChannels } from '../../../features/contact-specialist/index.ts';
import { practiceLocation as location } from '../../../entities/specialist/index.ts';
import { SectionLink } from '../../../shared/ui/index.ts';
import { publicSectionLinks, type SiteSection } from '../../../shared/routing/index.ts';

defineProps<{ activeSection: SiteSection }>();
const year = new Date().getFullYear();
const links = [{ section: 'home' as const, label: 'Главная' }, ...publicSectionLinks];
</script>

<style scoped>
.site-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--line);
  background: radial-gradient(ellipse at 10% 0, #b98b5910, transparent 60%), #211a15;
  color: var(--ink);
}
.site-footer__brand {
  grid-area: brand;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  width: fit-content;
  color: var(--ink);
  text-decoration: none;
  font: 400 32px/1.2 var(--display);
}
.site-footer__brand small {
  display: block;
  margin-top: 7px;
  font:
    400 11px/1.4 'Manrope',
    sans-serif;
  letter-spacing: 0.18em;
  color: var(--muted);
}
.site-footer__mark {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border: 1px solid #c2a584;
  border-radius: 50%;
  background: #a57b5030;
  font-style: italic;
}
.site-footer__columns {
  display: grid;
  grid-template-columns: 1.15fr 0.75fr 1fr 0.85fr;
  grid-template-areas: 'brand navigation address contacts';
  align-items: start;
  gap: 24px;
  padding-block: 40px;
}
.site-footer nav {
  grid-area: navigation;
}
.site-footer__address {
  grid-area: address;
}
.site-footer__contacts {
  grid-area: contacts;
}
.site-footer__column {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  font-size: 15px;
  line-height: 1.65;
}
.site-footer__column h2 {
  margin: 0 0 7px;
  color: var(--muted);
  font:
    500 12px/1.5 'Manrope',
    sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.site-footer__column a {
  color: var(--ink);
  text-decoration: none;
  text-underline-offset: 5px;
}
.site-footer__column a:hover,
.site-footer__column [aria-current='location'] {
  color: var(--accent);
  text-decoration: underline;
}
.site-footer__column .site-footer__text-link {
  color: var(--accent);
  font-style: italic;
}
.site-footer address {
  display: grid;
  gap: 4px;
  margin: 0;
  font-style: normal;
}
.site-footer address span {
  color: var(--muted);
}
.site-footer address strong {
  font-weight: 500;
}
.site-footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-block: 20px;
  border-top: 1px solid #70543e80;
  color: var(--muted);
  font-size: 12px;
}
@media (max-width: 991.98px) {
  .site-footer__columns {
    grid-template-columns: 0.8fr 1.1fr 1fr;
    grid-template-areas: 'brand brand brand' 'navigation address contacts';
    gap: 32px 24px;
  }
}
@media (max-width: 767.98px) {
  .site-footer__columns {
    gap: 32px 20px;
    padding-block: 28px;
  }
  .site-footer__bottom {
    flex-direction: column;
    gap: 8px;
    padding-right: 68px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
}
@media (max-width: 639.98px) {
  .site-footer__columns {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    grid-template-areas: 'brand brand' 'navigation address' 'contacts contacts';
  }
}
@media (max-width: 379.98px) {
  .site-footer__columns {
    grid-template-columns: 1fr;
    grid-template-areas: 'brand' 'navigation' 'address' 'contacts';
  }
}
</style>
