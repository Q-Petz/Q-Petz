import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Demo from '../pages/Demo.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/demo',
    name: 'Demo',
    component: Demo
  },
  // 可以在这里添加更多路由
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 