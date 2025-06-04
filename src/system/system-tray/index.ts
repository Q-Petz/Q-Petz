import { defaultWindowIcon } from "@tauri-apps/api/app";
import { Menu } from "@tauri-apps/api/menu";
import { TrayIcon, type TrayIconOptions } from "@tauri-apps/api/tray";
import { menu } from "./menu";

export async function setupSystemTray() {
  try {
    const trayIcon = await defaultWindowIcon();
    const trayMenu = await Menu.new(menu);
    const mergedOptions: TrayIconOptions = {
      // here you can add a tray menu, title, tooltip, event handler, etc
      icon: trayIcon as any,
      menu: trayMenu,
    };
    const tray = await TrayIcon.new(mergedOptions);
    return tray;
  } catch (error) {
    console.warn("系统托盘创建错误:", error);
  }
  return;
}
