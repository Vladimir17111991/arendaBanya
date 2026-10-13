<template>
  <AppShell />
</template>

<script setup lang="ts">
import './theme.scss';
import './public-theme.scss';
import { onBeforeUnmount } from 'vue';
import { createPracticeStore, providePractice } from '../entities/practice/index.ts';
import { demoGalleryPhotos } from './config/demo-gallery.ts';
import { demoSiteImages } from './config/site-images.ts';
import AppShell from './ui/AppShell.vue';
import { createNavigation } from './model/navigation.ts';
import { provideNavigation } from '../shared/routing/index.ts';
const store = createPracticeStore(undefined, {
  photos: demoGalleryPhotos,
  siteImages: demoSiteImages,
});
providePractice(store);
provideNavigation(createNavigation(() => store.isGuest.value));
onBeforeUnmount(store.dispose);
</script>
