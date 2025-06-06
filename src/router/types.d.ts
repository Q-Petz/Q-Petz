/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 15:02:40
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 15:59:46
 * @Email: jum1274001055@gmail.com
 */
import { RouteRecordRaw } from "vue-router";

interface Meta {
  // 是否在系统托盘菜单中显示
  isTrayMenuItem: boolean;
  // 菜单标题
  title: string;
}

export type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta: Meta;
};
