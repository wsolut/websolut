import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import sharedRoutes from './shared';

// Helper function to convert file paths to routes
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/pages/SplashScreen.vue'),
  },
  ...sharedRoutes,
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

globalThis.window.api.onMessage('navigate-to', (data?: Record<string, unknown>) => {
  const route = data?.route || '';

  void router.push(route);
});

export default router;
