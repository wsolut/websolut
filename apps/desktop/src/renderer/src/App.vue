<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterView } from 'vue-router';

import StandaloneLayout from './layouts/StandaloneLayout.vue';
import DefaultLayout from './layouts/DefaultLayout.vue';
import PreviewLayout from './layouts/PreviewLayout.vue';
import Toast from './components/common/Toast.vue';

const route = useRoute();

const layoutComponent = computed(() => {
  if (window.location.href.includes('view=standalone')) {
    return StandaloneLayout;
  }

  if (route.meta.layout === 'preview') {
    return PreviewLayout;
  }

  if (route.meta.layout === 'standalone') {
    return StandaloneLayout;
  }

  return DefaultLayout;
});
</script>

<template>
  <Toast />
  <component :is="layoutComponent">
    <RouterView />
  </component>
</template>
