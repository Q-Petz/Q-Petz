/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 12:36:53
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 16:00:03
 * @Email: jum1274001055@gmail.com
 */
import Demo from "../pages/Demo.vue";
import ModelConfiguration from "../pages/ModelConfiguration/index.vue";
import ModelViewer from "../pages/ModelViewer/index.vue";
import type { RouteRecordRawWithMeta } from "./types";

// 常量路由
export const constantRoutes: RouteRecordRawWithMeta[] = [
  {
    path: "/",
    name: "ModelViewer",
    component: ModelViewer,
    meta: {
      title: "模型视图",
      isTrayMenuItem: false,
    },
  },
  {
    path: "/demo",
    name: "Demo",
    component: Demo,
    meta: {
      title: "Demo",
      isTrayMenuItem: false,
    },
  },
  {
    path: "/model-config",
    name: "model-config",
    component: ModelConfiguration,
    meta: {
      title: "模型配置",
      isTrayMenuItem: true,
    },
  },
  // 可以在这里添加更多路由
];
