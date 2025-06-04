import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { constantRoutes } from "./constant";
import { App } from "vue";

export function setupRouter(app: App) {
  const router = createRouter({
    history: createWebHistory(),
    routes: constantRoutes,
  });
  app.use(router);
}
