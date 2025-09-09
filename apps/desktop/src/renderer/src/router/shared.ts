import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/projects',
    component: () => import('@/pages/projects/ProjectListPage.vue'),
  },
  {
    path: '/projects/:projectId',
    component: () => import('@/pages/projects/ProjectViewPage.vue'),
  },
  {
    path: '/projects/:projectId/preview/:pagePath?',
    meta: { layout: 'preview' },
    component: () => import('@/pages/pages/PreviewPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/errors/NotFoundPage.vue'),
  },
];

export default routes;
