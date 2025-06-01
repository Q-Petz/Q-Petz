// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WebviewWindowBuilder};

// 定义菜单项事件处理
fn handle_menu_event(app: &tauri::AppHandle, event_id: &str) {
    match event_id {
        "quit" => {
            std::process::exit(0);
        }
        "demo_page" => {
            // 创建一个新窗口显示demo页面
            let window = WebviewWindowBuilder::new(app, "demo_window", tauri::WebviewUrl::App("demo.html".into()))
                .title("Demo Window")
                .inner_size(600.0, 400.0)
                .build()
                .unwrap();
        }
        _ => {}
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            // 创建托盘菜单
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let demo_item = MenuItem::with_id(app, "demo_page", "打开Demo页面", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&demo_item, &quit_item])?;

            // 创建托盘图标
            let tray_icon = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| {
                    handle_menu_event(app, event.id.as_ref());
                })
                .on_tray_icon_event(|app, event| {
                    // 当左键点击托盘图标时，可以添加其他处理
                    if let TrayIconEvent::Click { .. } = event {
                        println!("托盘图标被点击");
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
