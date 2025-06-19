/*
 * @Author: AnthonyLuo
 * @Date: 2025-06-04 11:33:08
 * @LastEditors: AnthonyLuo
 * @LastEditTime: 2025-06-04 14:52:40
 * @Email: jum1274001055@gmail.com
 */
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::window::Color;
use tauri::{WebviewUrl, WebviewWindowBuilder, AppHandle, Emitter};
use tauri::{Manager, State};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConfigMessage {
    pub event_type: String,
    pub data: serde_json::Value,
    pub source_window: String,
    pub timestamp: u64,
}

#[derive(Default)]
pub struct AppState {
    pub message_bus: Arc<Mutex<HashMap<String, ConfigMessage>>>,
}

#[tauri::command]
async fn broadcast_config(
    app_handle: AppHandle,
    event_type: String,
    data: serde_json::Value,
    source_window: String,
) -> Result<(), String> {
    let message = ConfigMessage {
        event_type: event_type.clone(),
        data,
        source_window: source_window.clone(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    };

    // 发送到所有窗口
    if let Err(e) = app_handle.emit(&event_type, &message) {
        return Err(format!("Failed to emit event: {}", e));
    }

    // 存储最新配置状态
    if let Ok(mut bus) = app_handle.state::<AppState>().message_bus.lock() {
        bus.insert(event_type, message);
    }

    Ok(())
}

#[tauri::command]
async fn get_latest_config(
    app_state: State<'_, AppState>,
    event_type: String,
) -> Result<Option<ConfigMessage>, String> {
    if let Ok(bus) = app_state.message_bus.lock() {
        Ok(bus.get(&event_type).cloned())
    } else {
        Err("Failed to access message bus".to_string())
    }
}

#[tauri::command]
async fn request_config_sync(
    app_handle: AppHandle,
    requesting_window: String,
) -> Result<(), String> {
    let message = ConfigMessage {
        event_type: "config_request".to_string(),
        data: serde_json::json!({}),
        source_window: requesting_window,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    };

    if let Err(e) = app_handle.emit("config_request", &message) {
        return Err(format!("Failed to emit config request: {}", e));
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn create_app() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            broadcast_config,
            get_latest_config,
            request_config_sync
        ])
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
