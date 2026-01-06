use std::fs;
use std::path::PathBuf;
use tauri::Manager;

mod db;
mod role;
mod knowledge;
mod claude;
mod session;
mod hooks;
mod auth;
mod workspaces;
mod vaults;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Nori.", name)
}

/// Copy knowledge packages from project to ~/.nori/knowledge/
fn copy_knowledge_packages(nori_dir: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    // Get current directory and navigate to project root
    // In dev mode: app/src-tauri -> app -> project_root
    let current_dir = std::env::current_dir()?;
    let project_root = current_dir
        .parent()
        .and_then(|p| p.parent())
        .ok_or("Could not find project root")?;

    let vault_path = project_root.join(".claude").join("knowledge").join("vault");

    if !vault_path.exists() {
        println!("Warning: Knowledge vault not found at {:?}", vault_path);
        println!("Current dir: {:?}", current_dir);
        println!("Project root: {:?}", project_root);
        return Ok(());
    }

    let target_dir = nori_dir.join("knowledge");
    let mut count = 0;

    // Copy all .md files recursively
    for entry in walkdir::WalkDir::new(&vault_path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            // Get relative path from vault
            let rel_path = path.strip_prefix(&vault_path)?;
            let target_path = target_dir.join(rel_path);

            // Create parent directory if needed
            if let Some(parent) = target_path.parent() {
                fs::create_dir_all(parent)?;
            }

            // Copy file
            fs::copy(path, &target_path)?;
            count += 1;
        }
    }

    println!("Copied {} knowledge packages", count);
    Ok(())
}

/// Initialize .nori directory in user's home
fn init_nori_directory() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let nori_dir = home_dir.join(".nori");

    let is_first_run = !nori_dir.exists();

    if is_first_run {
        fs::create_dir_all(&nori_dir)?;
        println!("Created .nori directory at: {:?}", nori_dir);

        // Create subdirectories
        fs::create_dir_all(nori_dir.join("personalities"))?;
        fs::create_dir_all(nori_dir.join("knowledge"))?;
        fs::create_dir_all(nori_dir.join("hooks"))?;
        fs::create_dir_all(nori_dir.join("sessions"))?;

        println!("Initialized .nori subdirectories");

        // Initialize personality templates
        role::init_personalities(&nori_dir)?;
        println!("Created personality templates");

        // Copy knowledge packages
        copy_knowledge_packages(&nori_dir)?;

        // Initialize example hooks
        hooks::executor::init_example_hooks(&nori_dir.join("hooks"))?;
    }

    // Initialize database
    let db_path = nori_dir.join("nori.db");
    db::init_database(db_path)?;
    println!("Initialized database");

    Ok(nori_dir)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            role::load_personality,
            role::load_role_knowledge,
            role::save_active_role_backend,
            knowledge::commands::index_knowledge,
            knowledge::commands::search_knowledge,
            knowledge::commands::get_package,
            knowledge::commands::get_categories,
            knowledge::commands::get_tags,
            knowledge::commands::get_all_packages,
            knowledge::commands::save_package,
            knowledge::commands::validate_package,
            claude::commands::send_message,
            claude::commands::set_api_key,
            claude::commands::has_api_key,
            claude::commands::get_token_count,
            session::save_session,
            session::load_session,
            session::list_sessions,
            session::delete_session,
            hooks::commands::list_hooks,
            hooks::commands::execute_hook,
            auth::commands::set_oauth_token,
            auth::commands::get_oauth_token,
            auth::commands::has_oauth_token,
            auth::commands::is_token_valid,
            auth::oauth_commands::start_oauth_flow,
            auth::oauth_commands::complete_oauth_flow,
            auth::oauth_commands::clear_auth_tokens,
            workspaces::commands::list_workspaces,
            workspaces::commands::create_workspace,
            workspaces::commands::get_active_workspace,
            workspaces::commands::get_workspace_by_path,
            workspaces::commands::set_active_workspace,
            workspaces::commands::update_workspace_vault,
            vaults::commands::list_vaults,
            vaults::commands::create_vault,
            vaults::commands::delete_vault,
            vaults::commands::get_vault
        ])
        .manage(auth::oauth_commands::OAuthState::new())
        .setup(|app| {
            // Initialize .nori directory structure
            if let Err(e) = init_nori_directory() {
                eprintln!("Failed to initialize .nori directory: {}", e);
            }

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                } else {
                    eprintln!("Warning: Could not find main window to open devtools");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
