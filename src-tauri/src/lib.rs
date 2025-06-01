// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use tauri::{Manager, WebviewWindowBuilder, WebviewUrl};

#[tauri::command]
fn open_demo_page(app_handle: tauri::AppHandle) -> Result<(), String> {
    // 检查窗口是否已存在
    if let Some(window) = app_handle.get_webview_window("ModelConfiguration_window") {
        if !window.is_visible().unwrap_or(false) {
            let _ = window.show();
        }
        let _ = window.set_focus();
        return Ok(());
    }
    
    // 如果窗口未找到（这种情况在配置正确的前提下不应该发生）
    Err("无法找到Demo窗口".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn create_app() -> tauri::App {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, open_demo_page])
        .setup(|app| {
            // 创建菜单
            let quit = MenuItem::with_id(app, "quit", "退出程序", true, None::<&str>)?;
            let ModelConfiguration = MenuItem::with_id(app, "ModelConfiguration", "模型参数配置", true, None::<&str>)?;
            // 创建一个分隔符菜单项
            let menu = Menu::with_items(app, &[&ModelConfiguration, &quit])?;

            // 创建托盘图标
            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone()) // 使用app icon作为托盘图标
                .menu(&menu)
                .tooltip("QPetz")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "ModelConfiguration" => {
                        let _ = open_demo_page(app.clone());
                    }
                    _ => {}
                })
                .on_tray_icon_event(|app, event| match event {
                    // 托盘图标左键点击时打开Demo页面
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let _ = open_demo_page(app.app_handle().clone());
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
}
