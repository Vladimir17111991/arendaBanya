<template>
  <a :href="`#${to}`" @click="follow"><slot /></a>
</template>

<script setup lang="ts">
import { useSiteNavigation, type SiteSection } from '../routing/index.ts';
const props = defineProps<{ to: SiteSection }>();
const { navigateToSection } = useSiteNavigation();

function follow(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  navigateToSection(props.to);
}
</script>
