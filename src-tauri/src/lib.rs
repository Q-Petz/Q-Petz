/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 11:33:08
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 14:52:40
 * @Email: jum1274001055@gmail.com
 */
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::window::Color;
use tauri::{WebviewUrl, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn create_app() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .setup(|app| {
            // 创建主窗口
            let _ = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Pet Desktop")
                .inner_size(800.0, 600.0)
                .decorations(false)
                .transparent(true)
                .background_color(Color(0, 0, 0, 0))
                .resizable(true)
                .always_on_top(false)
                .skip_taskbar(false)
                .shadow(false)
                .build();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application")
}
