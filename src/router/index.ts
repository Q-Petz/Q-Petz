import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Demo from '../pages/Demo.vue';
import ModelConfiguration from '../pages/ModelConfiguration/index.vue';
import ModelViewer from '../pages/ModelViewer/index.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/ModelViewer',
    name: 'ModelViewer',
    component: ModelViewer
  },
  {
    path: '/demo',
    name: 'Demo',
    component: Demo
  },
  {
    path: '/model-config',
    name: 'ModelConfiguration',
    component: ModelConfiguration
  },
  // 可以在这里添加更多路由
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 