import { onMounted, onUnmounted } from 'vue';
export function useReveal() {
  let observer: IntersectionObserver | undefined;
  onMounted(() => {
    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.remove('section-reveal--pending');
            observer?.unobserve(entry.target);
          }
      },
      // Long galleries can be taller than the viewport; reveal as soon as they enter it.
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    );
    for (const element of document.querySelectorAll('.section-reveal')) {
      element.classList.add('section-reveal--pending');
      observer.observe(element);
    }
  });
  onUnmounted(() => observer?.disconnect());
}
