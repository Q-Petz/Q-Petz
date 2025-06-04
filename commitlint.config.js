/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 16:17:57
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 16:19:15
 * @Email: jum1274001055@gmail.com
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新功能
        "fix", // 修复bug
        "docs", // 文档变更
        "style", // 代码格式（不影响代码运行的变动）
        "refactor", // 重构（即不是新增功能，也不是修复bug的代码变动）
        "perf", // 性能优化
        "test", // 增加测试
        "chore", // 构建过程或辅助工具的变动
        "revert", // 回滚
        "build", // 构建系统或外部依赖的变动
        "ci", // CI配置文件和脚本的变动
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72],
    "body-leading-blank": [1, "always"],
    "footer-leading-blank": [1, "always"],
  },
};
