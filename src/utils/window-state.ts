import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { configSync } from "./config-sync";

export class WindowStateManager {
  private static modelViewerLabel = "main";
  private static configWindowLabel = "模型配置";

  /**
   * 检查模型查看器窗口是否存在
   */
  static async isModelViewerExists(): Promise<boolean> {
    try {
      const window = await WebviewWindow.getByLabel(this.modelViewerLabel);
      return window !== null;
    } catch {
      return false;
    }
  }

  /**
   * 检查配置窗口是否存在
   */
  static async isConfigWindowExists(): Promise<boolean> {
    try {
      const window = await WebviewWindow.getByLabel(this.configWindowLabel);
      return window !== null;
    } catch {
      return false;
    }
  }

  /**
   * 从模型查看器窗口请求当前配置
   */
  static async requestConfigFromViewer(): Promise<void> {
    if (await this.isModelViewerExists()) {
      await configSync.requestCurrentConfig(this.modelViewerLabel);
    }
  }

  /**
   * 从配置窗口请求当前配置
   */
  static async requestConfigFromConfigWindow(): Promise<void> {
    if (await this.isConfigWindowExists()) {
      await configSync.requestCurrentConfig(this.configWindowLabel);
    }
  }

  /**
   * 获取当前窗口类型
   */
  static getCurrentWindowType(): "viewer" | "config" | "unknown" {
    const currentLabel = WebviewWindow.getCurrent().label;
    
    if (currentLabel === this.modelViewerLabel) {
      return "viewer";
    } else if (currentLabel === this.configWindowLabel) {
      return "config";
    }
    
    return "unknown";
  }

  /**
   * 同步配置从其他窗口
   */
  static async syncFromOtherWindow(): Promise<void> {
    const windowType = this.getCurrentWindowType();
    
    if (windowType === "config") {
      // 配置窗口从查看器窗口请求配置
      await this.requestConfigFromViewer();
    } else if (windowType === "viewer") {
      // 查看器窗口从配置窗口请求配置
      await this.requestConfigFromConfigWindow();
    }
  }
}