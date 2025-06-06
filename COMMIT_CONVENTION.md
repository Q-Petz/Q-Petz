<!--
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 16:20:38
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 16:21:46
 * @Email: jum1274001055@gmail.com
-->

# 提交规范说明

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范来标准化提交信息。

## 提交信息格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## 提交类型 (Type)

- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档变更
- **style**: 代码格式（不影响代码运行的变动）
- **refactor**: 重构（即不是新增功能，也不是修复bug的代码变动）
- **perf**: 性能优化
- **test**: 增加测试
- **chore**: 构建过程或辅助工具的变动
- **revert**: 回滚
- **build**: 构建系统或外部依赖的变动
- **ci**: CI配置文件和脚本的变动

## 提交示例

```bash
# 新功能
feat: 添加用户登录功能

# 修复bug
fix: 修复用户头像显示问题

# 文档更新
docs: 更新API文档

# 代码重构
refactor(auth): 重构用户认证模块

# 性能优化
perf: 优化图片加载性能
```

## 使用方式

### 方式一：使用Commitizen (推荐)

```bash
pnpm run commit
```

这会启动交互式提交向导，帮助您生成规范的提交信息。

### 方式二：手动编写

```bash
git commit -m "feat: 添加新功能"
```

## 自动化检查

项目配置了以下自动化检查：

- **pre-commit**: 提交前自动格式化代码并进行代码质量检查
- **commit-msg**: 验证提交信息是否符合规范

如果提交信息不符合规范，提交将被拒绝，请按照提示修改后重新提交。
