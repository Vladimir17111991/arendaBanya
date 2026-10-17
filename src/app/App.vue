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
import {
  createReviewStore,
  createDemoReviewRepository,
  createSupabaseReviewRepository,
  provideReviews,
  type ReviewRepository,
} from '../entities/review/index.ts';
let reviewRepository: ReviewRepository | undefined;
const reviewUrl = import.meta.env.VITE_SUPABASE_URL;
const reviewKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (reviewUrl && reviewKey) {
  try {
    reviewRepository = createSupabaseReviewRepository(reviewUrl, reviewKey);
  } catch {
    console.error('Проверьте публичные настройки Supabase: база отзывов не подключена.');
  }
} else if (import.meta.env.DEV && import.meta.env.VITE_REVIEWS_DEMO === 'true') {
  reviewRepository = createDemoReviewRepository();
}
const reviewStore = createReviewStore(reviewRepository);
provideReviews(reviewStore);
void reviewStore.init();
onBeforeUnmount(reviewStore.dispose);
const store = createPracticeStore(undefined, {
  photos: demoGalleryPhotos,
  siteImages: demoSiteImages,
});
providePractice(store);
provideNavigation(createNavigation(() => store.isGuest.value));
onBeforeUnmount(store.dispose);
</script>
