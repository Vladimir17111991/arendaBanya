<template>
  <Transition name="mobile-contact">
    <div v-if="visible" class="mobile-contact" aria-label="Быстрая связь">
      <div class="container d-flex align-items-center justify-content-center gap-2">
        <ContactLink
          :service-name="serviceName"
          class="btn btn-primary section-button mobile-contact__button"
        >
          Связаться
        </ContactLink>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import ContactLink from './ContactLink.vue';
defineProps<{ serviceName?: string }>();
const visible = ref(false);
let frame = 0;
function update() {
  frame = 0;
  const anchor = document.getElementById('hero-contact');
  const contacts = document.getElementById('contacts');
  const contactsVisible =
    contacts && contacts.getBoundingClientRect().top < window.innerHeight - 80;
  visible.value = !!anchor && anchor.getBoundingClientRect().bottom < 82 && !contactsVisible;
}
function queueUpdate() {
  if (!frame) frame = requestAnimationFrame(update);
}
onMounted(() => {
  update();
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
});
onUnmounted(() => {
  cancelAnimationFrame(frame);
  window.removeEventListener('scroll', queueUpdate);
  window.removeEventListener('resize', queueUpdate);
});
</script>

<style scoped>
.mobile-contact {
  display: none;
}
@media (max-width: 767.98px) {
  .mobile-contact {
    display: block;
    position: fixed;
    inset: auto 0 0;
    z-index: 1020;
    padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
    border-top: 1px solid #d9ddce;
    background: #f8f8efed;
    backdrop-filter: blur(18px);
    box-shadow: 0 -6px 30px #51344616;
  }
  .mobile-contact__button {
    min-height: 50px;
    gap: 10px;
    font-size: 14px;
    padding: 7px 12px;
  }
  .mobile-contact__dates {
    flex-shrink: 0;
    display: grid;
    place-content: center;
    padding: 5px 10px;
    min-height: 48px;
    color: var(--brand);
    font-size: 12px;
    line-height: 1.4;
    text-decoration: none;
    text-align: center;
  }
  .mobile-contact-enter-active,
  .mobile-contact-leave-active {
    transition:
      opacity 0.22s,
      transform 0.22s;
  }
  .mobile-contact-enter-from,
  .mobile-contact-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
}
</style>
