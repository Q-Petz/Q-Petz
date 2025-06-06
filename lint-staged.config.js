/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 16:18:07
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 16:23:07
 * @Email: jum1274001055@gmail.com
 */
export default {
  "src/**/*.{js,ts,vue}": ["biome check --write --no-errors-on-unmatched"],
  "src/**/*.json": ["biome format --write --no-errors-on-unmatched"],
  "*.{md,yaml,yml}": ["prettier --write"],
};
