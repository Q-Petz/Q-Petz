/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 11:33:08
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 16:18:01
 * @Email: jum1274001055@gmail.com
 */
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
