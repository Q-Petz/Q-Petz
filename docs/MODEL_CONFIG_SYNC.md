# 模型配置实时同步系统

## 概述

本系统实现了跨窗口的模型配置实时同步功能，允许在配置窗口中调整参数时，模型查看器窗口能够实时响应并更新显示效果。

## 架构设计

### 1. IPC Bridge (跨窗口通信桥接)

- **文件**: `src/utils/ipc-bridge.ts`
- **功能**: 提供统一的跨窗口消息传递接口
- **特性**:
  - 支持广播消息到所有窗口
  - 支持点对点消息发送
  - 自动过滤自身发送的消息
  - 提供事件监听和取消监听机制

### 2. Config Sync Manager (配置同步管理器)

- **文件**: `src/utils/config-sync.ts`
- **功能**: 管理配置状态的同步逻辑
- **特性**:
  - 内置防抖机制，避免频繁更新
  - 支持分类配置同步（光源、模型、相机等）
  - 自动持久化到本地存储
  - 支持配置请求/响应机制

### 3. Window State Manager (窗口状态管理)

- **文件**: `src/utils/window-state.ts`
- **功能**: 管理窗口间的状态同步
- **特性**:
  - 检测窗口存在性
  - 识别当前窗口类型
  - 协调窗口间的配置同步

## 使用流程

### 1. 初始化

在配置页面和模型查看器页面的 `onMounted` 钩子中：

```typescript
// 加载本地存储的配置
store.loadFromLocalStorage();

// 初始化配置同步监听
store.initConfigSync();

// 从其他窗口同步配置（如果存在）
await WindowStateManager.syncFromOtherWindow();
```

### 2. 配置更新

当用户在配置页面调整参数时：

1. 页面组件通过 `v-model` 更新 store 中的值
2. `watch` 监听器检测到变化，触发防抖更新函数
3. Store 的 action 方法同时：
   - 通过 Tauri IPC 发送事件（本窗口内同步）
   - 通过 Config Sync Manager 广播到其他窗口
4. 模型查看器窗口接收到更新，自动应用新配置

### 3. 防抖优化

所有配置更新都经过 300ms 的防抖处理：

```typescript
const debouncedLightUpdate = debounce(() => {
  store.updateLightConfig({
    lightIntensity: store.lightIntensity,
    lightColor: store.lightColor,
    lightPosition: store.lightPosition,
  });
}, 300);
```

## 配置分类

系统将配置分为以下几类，每类独立同步：

1. **光源配置** (Light Config)
   - 光源强度
   - 光源颜色
   - 光源位置

2. **模型配置** (Model Config)
   - 模型缩放
   - 自动旋转
   - 浮动动画

3. **相机配置** (Camera Config)
   - 相机距离
   - 相机视角

4. **背景配置** (Background Config)
   - 背景颜色/透明

5. **动画配置** (Animation Config)
   - 旋转速度

## 持久化

配置自动保存到浏览器的 LocalStorage 中，确保：
- 刷新页面后配置保持
- 新开窗口能够读取之前的配置
- 关闭应用后配置不丢失

## 注意事项

1. **性能考虑**: 使用防抖避免频繁更新造成的性能问题
2. **数据类型**: 确保所有数值类型在传输过程中保持正确
3. **窗口标识**: 依赖窗口的 label 进行识别，确保窗口创建时使用正确的标识
4. **错误处理**: 当目标窗口不存在时，系统会静默处理，不会报错