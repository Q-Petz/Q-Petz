/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 15:02:40
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 15:03:55
 * @Email: jum1274001055@gmail.com
 */
import { RouteRecordRaw } from "vue-router";

interface Meta {
  isTrayMenu: boolean;
  title: string;
}

export type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta: Meta;
};
