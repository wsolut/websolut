import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import sharedRoutes from './shared';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/projects',
  },
  ...sharedRoutes,
];

const router = createRouter({
  history: createWebHistory('/spa/'),
  routes,
});

router.beforeEach((to, from, next) => {
  const standalone = from.query.view === 'standalone' || to.query.view === 'standalone';

  if (standalone && to.query.view !== 'standalone') {
    next({
      ...to,
      query: {
        ...to.query,
        view: 'standalone',
      },
    });
  } else {
    next();
  }
});

export default router;
