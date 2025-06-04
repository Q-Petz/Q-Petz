/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 12:36:53
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 15:04:08
 * @Email: jum1274001055@gmail.com
 */
import Demo from "../pages/Demo.vue";
import ModelConfiguration from "../pages/ModelConfiguration/index.vue";
import ModelViewer from "../pages/ModelViewer/index.vue";
import { RouteRecordRawWithMeta } from "./types";

// 常量路由
export const constantRoutes: RouteRecordRawWithMeta[] = [
  {
    path: "/",
    name: "ModelViewer",
    component: ModelViewer,
    meta: {
      title: "模型视图",
      isTrayMenu: false,
    },
  },
  {
    path: "/demo",
    name: "Demo",
    component: Demo,
    meta: {
      title: "Demo",
      isTrayMenu: false,
    },
  },
  {
    path: "/model-config",
    name: "ModelConfiguration",
    component: ModelConfiguration,
    meta: {
      title: "模型配置",
      isTrayMenu: true,
    },
  },
  // 可以在这里添加更多路由
];
