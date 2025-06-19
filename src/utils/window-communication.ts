import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export interface ConfigMessage {
  event_type: string;
  data: any;
  source_window: string;
  timestamp: number;
}

export class WindowCommunication {
  private static instance: WindowCommunication;
  private listeners: Map<string, UnlistenFn[]> = new Map();
  private currentWindow: string;

  private constructor() {
    this.currentWindow = WebviewWindow.getCurrent().label;
    this.setupConfigRequestListener();
  }

  static getInstance(): WindowCommunication {
    if (!WindowCommunication.instance) {
      WindowCommunication.instance = new WindowCommunication();
    }
    return WindowCommunication.instance;
  }

  /**
   * 广播配置更新到所有窗口
   */
  async broadcastConfig(eventType: string, data: any): Promise<void> {
    try {
      await invoke("broadcast_config", {
        eventType,
        data,
        sourceWindow: this.currentWindow,
      });
    } catch (error) {
      console.error("Failed to broadcast config:", error);
    }
  }

  /**
   * 监听特定配置更新事件
   */
  async onConfigUpdate(
    eventType: string,
    callback: (data: any) => void
  ): Promise<() => void> {
    const unlisten = await listen<ConfigMessage>(eventType, (event) => {
      // 忽略自己发出的事件
      if (event.payload.source_window === this.currentWindow) {
        return;
      }
      callback(event.payload.data);
    });

    // 保存取消监听函数
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(unlisten);

    // 返回取消监听函数
    return () => {
      unlisten();
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(unlisten);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 获取最新的配置状态
   */
  async getLatestConfig(eventType: string): Promise<any | null> {
    try {
      const result = await invoke<ConfigMessage | null>("get_latest_config", {
        eventType,
      });
      return result?.data || null;
    } catch (error) {
      console.error("Failed to get latest config:", error);
      return null;
    }
  }

  /**
   * 请求其他窗口同步配置
   */
  async requestConfigSync(): Promise<void> {
    try {
      await invoke("request_config_sync", {
        requestingWindow: this.currentWindow,
      });
    } catch (error) {
      console.error("Failed to request config sync:", error);
    }
  }

  /**
   * 设置配置请求处理器
   */
  onConfigRequest(handler: () => any): () => void {
    return this.onConfigUpdate("config_request", () => {
      const currentConfig = handler();
      this.broadcastConfig("full_config_sync", currentConfig);
    });
  }

  /**
   * 设置配置请求监听器
   */
  private async setupConfigRequestListener(): Promise<void> {
    await this.onConfigUpdate("config_request", () => {
      // 当收到配置请求时，如果有配置处理器会响应
    });
  }

  /**
   * 清理所有监听器
   */
  dispose(): void {
    this.listeners.forEach((listeners) => {
      listeners.forEach((unlisten) => unlisten());
    });
    this.listeners.clear();
  }

  /**
   * 获取当前窗口标签
   */
  getCurrentWindowLabel(): string {
    return this.currentWindow;
  }
}

// 配置事件类型常量
export const CONFIG_EVENTS = {
  LIGHT_UPDATE: "light_config_update",
  MODEL_UPDATE: "model_config_update",
  CAMERA_UPDATE: "camera_config_update",
  BACKGROUND_UPDATE: "background_config_update",
  ANIMATION_UPDATE: "animation_config_update",
  FULL_CONFIG_SYNC: "full_config_sync",
} as const;

// 导出单例实例
export const windowComm = WindowCommunication.getInstance();