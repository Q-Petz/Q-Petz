import { ipcBridge } from "./ipc-bridge";
import type { ModelConfigState } from "@/store/modelConfigStore";
import { debounce } from "./debounce";

export interface ConfigSyncOptions {
  debounceDelay?: number;
  persistToStorage?: boolean;
}

export class ConfigSyncManager {
  private static instance: ConfigSyncManager;
  private syncHandlers: Map<string, (data: any) => void> = new Map();
  private debounceDelay: number;
  private persistToStorage: boolean;
  
  // 配置变更事件
  private readonly CONFIG_EVENTS = {
    LIGHT_UPDATE: "config:light:update",
    MODEL_UPDATE: "config:model:update",
    CAMERA_UPDATE: "config:camera:update",
    BACKGROUND_UPDATE: "config:background:update",
    ANIMATION_UPDATE: "config:animation:update",
    FULL_UPDATE: "config:full:update",
  };

  private constructor(options: ConfigSyncOptions = {}) {
    this.debounceDelay = options.debounceDelay ?? 100;
    this.persistToStorage = options.persistToStorage ?? true;
    this.setupListeners();
  }

  static getInstance(options?: ConfigSyncOptions): ConfigSyncManager {
    if (!ConfigSyncManager.instance) {
      ConfigSyncManager.instance = new ConfigSyncManager(options);
    }
    return ConfigSyncManager.instance;
  }

  private setupListeners() {
    // 监听所有配置更新事件
    Object.values(this.CONFIG_EVENTS).forEach((eventName) => {
      ipcBridge.on(eventName, (data) => {
        const handler = this.syncHandlers.get(eventName);
        if (handler) {
          handler(data);
        }
      });
    });
  }

  /**
   * 注册配置同步处理器
   */
  onConfigUpdate(event: string, handler: (data: any) => void): () => void {
    this.syncHandlers.set(event, handler);
    
    // 返回取消注册函数
    return () => {
      this.syncHandlers.delete(event);
    };
  }

  /**
   * 同步光源配置
   */
  syncLightConfig = debounce(
    async (config: Partial<Pick<ModelConfigState, "lightIntensity" | "lightColor" | "lightPosition">>) => {
      await ipcBridge.broadcast(this.CONFIG_EVENTS.LIGHT_UPDATE, config);
      
      if (this.persistToStorage) {
        this.saveToStorage("lightConfig", config);
      }
    },
    this.debounceDelay
  );

  /**
   * 同步模型配置
   */
  syncModelConfig = debounce(
    async (config: Partial<Pick<ModelConfigState, "modelScale" | "modelAutoRotate" | "modelFloatAnimation">>) => {
      await ipcBridge.broadcast(this.CONFIG_EVENTS.MODEL_UPDATE, config);
      
      if (this.persistToStorage) {
        this.saveToStorage("modelConfig", config);
      }
    },
    this.debounceDelay
  );

  /**
   * 同步相机配置
   */
  syncCameraConfig = debounce(
    async (config: Partial<Pick<ModelConfigState, "cameraDistance" | "cameraFov">>) => {
      await ipcBridge.broadcast(this.CONFIG_EVENTS.CAMERA_UPDATE, config);
      
      if (this.persistToStorage) {
        this.saveToStorage("cameraConfig", config);
      }
    },
    this.debounceDelay
  );

  /**
   * 同步背景配置
   */
  syncBackgroundConfig = debounce(
    async (backgroundColor: string) => {
      await ipcBridge.broadcast(this.CONFIG_EVENTS.BACKGROUND_UPDATE, { backgroundColor });
      
      if (this.persistToStorage) {
        this.saveToStorage("backgroundConfig", { backgroundColor });
      }
    },
    this.debounceDelay
  );

  /**
   * 同步动画配置
   */
  syncAnimationConfig = debounce(
    async (config: { rotationSpeed: number }) => {
      await ipcBridge.broadcast(this.CONFIG_EVENTS.ANIMATION_UPDATE, config);
      
      if (this.persistToStorage) {
        this.saveToStorage("animationConfig", config);
      }
    },
    this.debounceDelay
  );

  /**
   * 同步完整配置
   */
  syncFullConfig = debounce(
    async (config: ModelConfigState) => {
      await ipcBridge.broadcast(this.CONFIG_EVENTS.FULL_UPDATE, config);
      
      if (this.persistToStorage) {
        localStorage.setItem("modelConfig", JSON.stringify(config));
      }
    },
    this.debounceDelay
  );

  /**
   * 从存储加载配置
   */
  loadFromStorage(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to load ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * 保存配置到存储
   */
  private saveToStorage(key: string, data: any) {
    try {
      const existing = this.loadFromStorage("modelConfig") || {};
      const updated = { ...existing, ...data };
      localStorage.setItem("modelConfig", JSON.stringify(updated));
    } catch (error) {
      console.error(`Failed to save ${key} to storage:`, error);
    }
  }

  /**
   * 请求其他窗口的当前配置
   */
  async requestCurrentConfig(targetWindow?: string): Promise<void> {
    if (targetWindow) {
      await ipcBridge.sendTo(targetWindow, "config:request", {});
    } else {
      await ipcBridge.broadcast("config:request", {});
    }
  }

  /**
   * 响应配置请求
   */
  onConfigRequest(handler: () => ModelConfigState): () => void {
    return ipcBridge.on("config:request", async () => {
      const config = handler();
      await ipcBridge.broadcast(this.CONFIG_EVENTS.FULL_UPDATE, config);
    });
  }

  /**
   * 获取配置事件枚举
   */
  getConfigEvents() {
    return { ...this.CONFIG_EVENTS };
  }

  /**
   * 清理资源
   */
  dispose() {
    this.syncHandlers.clear();
  }
}

// 导出单例实例
export const configSync = ConfigSyncManager.getInstance();