<template>
  <SectionLink
    :to="to"
    class="btn btn-primary section-button"
    :class="`section-button--${direction}`"
  >
    <slot />
  </SectionLink>
</template>

<script setup lang="ts">
import type { SiteSection } from '../routing/index.ts';
import SectionLink from './SectionLink.vue';
withDefaults(defineProps<{ to: SiteSection; direction?: 'diagonal' | 'down' }>(), {
  direction: 'diagonal',
});
</script>
