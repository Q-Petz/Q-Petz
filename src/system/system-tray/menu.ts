/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 13:29:00
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 15:22:37
 * @Email: jum1274001055@gmail.com
 */
import { MenuOptions } from "@tauri-apps/api/menu";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const menu: MenuOptions = {
  items: [
    {
      id: "模型配置",
      text: "ModelConfiguration",
      action: async () => {
        try {
          // 检查窗口是否已存在
          const existingWindow = await WebviewWindow.getByLabel(
            "model_config_window"
          );
          if (existingWindow) {
            // 如果窗口存在，显示并聚焦
            await existingWindow.show();
            await existingWindow.setFocus();
            return;
          }

          // 创建新的模型配置窗口
          const modelConfigWindow = new WebviewWindow("model_config_window", {
            url: "/model-config",
            title: "模型配置",
            width: 900,
            height: 700,
            resizable: true,
            decorations: true,
            alwaysOnTop: false,
            skipTaskbar: false,
          });

          // 监听窗口创建完成事件
          modelConfigWindow.once("tauri://created", () => {
            console.log("模型配置窗口创建成功");
          });

          // 监听窗口创建错误事件
          modelConfigWindow.once("tauri://error", (e) => {
            console.error("创建模型配置窗口失败:", e);
          });
        } catch (error) {
          console.error("打开模型配置窗口失败:", error);
        }
      },
    },
    {
      id: "退出",
      text: "Quit",
      action: () => {},
    },
  ],
};
