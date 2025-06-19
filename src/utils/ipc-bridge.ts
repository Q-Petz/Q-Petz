import { emit, listen, type Event, type UnlistenFn } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

interface IPCMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  source?: string;
}

interface ListenerInfo {
  unlisten: UnlistenFn;
  callback: (payload: any) => void;
}

export class IPCBridge {
  private static instance: IPCBridge;
  private listeners: Map<string, ListenerInfo[]> = new Map();
  private windowLabel: string;
  private broadcastChannel: string = "ipc-bridge:broadcast";

  private constructor() {
    this.windowLabel = WebviewWindow.getCurrent().label;
    this.setupBroadcastListener();
  }

  static getInstance(): IPCBridge {
    if (!IPCBridge.instance) {
      IPCBridge.instance = new IPCBridge();
    }
    return IPCBridge.instance;
  }

  private async setupBroadcastListener() {
    const unlisten = await listen<IPCMessage>(this.broadcastChannel, (event) => {
      // 忽略自己发送的消息
      if (event.payload.source === this.windowLabel) {
        return;
      }

      // 触发对应的本地监听器
      const listeners = this.listeners.get(event.payload.type);
      if (listeners) {
        listeners.forEach((listener) => {
          listener.callback(event.payload.payload);
        });
      }
    });

    // 保存广播监听器
    this.addListenerInfo(this.broadcastChannel, { unlisten, callback: () => {} });
  }

  private addListenerInfo(eventType: string, info: ListenerInfo) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(info);
  }

  /**
   * 发送消息到所有窗口
   */
  async broadcast<T = unknown>(type: string, payload: T): Promise<void> {
    const message: IPCMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source: this.windowLabel,
    };

    await emit(this.broadcastChannel, message);
  }

  /**
   * 发送消息到特定窗口
   */
  async sendTo<T = unknown>(windowLabel: string, type: string, payload: T): Promise<void> {
    const targetWindow = await WebviewWindow.getByLabel(windowLabel);
    if (!targetWindow) {
      console.warn(`Window ${windowLabel} not found`);
      return;
    }

    const message: IPCMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source: this.windowLabel,
    };

    await emit(`${windowLabel}:${type}`, message);
  }

  /**
   * 监听特定类型的消息
   */
  async on<T = unknown>(
    type: string,
    callback: (payload: T) => void
  ): Promise<() => void> {
    // 监听直接发送到当前窗口的消息
    const directChannel = `${this.windowLabel}:${type}`;
    const unlisten = await listen<IPCMessage<T>>(directChannel, (event) => {
      callback(event.payload.payload);
    });

    const listenerInfo: ListenerInfo = {
      unlisten,
      callback: callback as (payload: any) => void,
    };

    this.addListenerInfo(type, listenerInfo);

    // 返回取消监听函数
    return () => {
      unlisten();
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(listenerInfo);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 监听一次性消息
   */
  async once<T = unknown>(type: string, callback: (payload: T) => void): Promise<void> {
    const unlisten = await this.on<T>(type, (payload) => {
      callback(payload);
      unlisten();
    });
  }

  /**
   * 清理所有监听器
   */
  dispose(): void {
    this.listeners.forEach((listeners) => {
      listeners.forEach((listener) => {
        listener.unlisten();
      });
    });
    this.listeners.clear();
  }

  /**
   * 获取当前窗口标签
   */
  getCurrentWindowLabel(): string {
    return this.windowLabel;
  }

  /**
   * 检查指定窗口是否存在
   */
  async isWindowExists(label: string): Promise<boolean> {
    try {
      const window = await WebviewWindow.getByLabel(label);
      return window !== null;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const ipcBridge = IPCBridge.getInstance();