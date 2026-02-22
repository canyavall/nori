#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // In release mode, spawn the sidecar server
            #[cfg(not(debug_assertions))]
            {
                use tauri::Manager;
                use tauri_plugin_shell::ShellExt;

                let shell = app.shell();
                let sidecar = shell
                    .sidecar("nori-server")
                    .expect("failed to create nori-server sidecar command");

                let (_rx, child) = sidecar
                    .spawn()
                    .expect("failed to spawn nori-server sidecar");

                app.manage(SidecarChild(std::sync::Mutex::new(Some(child))));
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                #[cfg(not(debug_assertions))]
                {
                    use tauri::Manager;
                    if let Some(state) = app.try_state::<SidecarChild>() {
                        if let Ok(mut guard) = state.0.lock() {
                            if let Some(child) = guard.take() {
                                let _ = child.kill();
                            }
                        }
                    }
                }
            }
        });
}

struct SidecarChild(std::sync::Mutex<Option<tauri_plugin_shell::process::CommandChild>>);
