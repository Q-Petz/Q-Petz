import type { App } from "vue";
import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import { constantRoutes } from "./constant";

export function setupRouter(app: App) {
  const router = createRouter({
    history: createWebHistory(),
    routes: constantRoutes,
  });
  app.use(router);
}
