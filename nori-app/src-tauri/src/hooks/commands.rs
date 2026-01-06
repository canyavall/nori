use super::executor::{execute_hook as exec_hook, scan_hooks};
use super::{HookInfo, HookResult};
use std::path::PathBuf;

/// List all hooks in .nori/hooks/
#[tauri::command]
pub fn list_hooks() -> Result<Vec<HookInfo>, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let hooks_dir = home_dir.join(".nori").join("hooks");

    scan_hooks(&hooks_dir)
}

/// Execute a hook with JSON input
#[tauri::command]
pub fn execute_hook(
    hook_name: String,
    _event: String,
    data: serde_json::Value,
) -> Result<HookResult, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let hooks_dir = home_dir.join(".nori").join("hooks");

    // Find hook file by name
    let hooks = scan_hooks(&hooks_dir)?;
    let hook = hooks
        .iter()
        .find(|h| h.name == hook_name)
        .ok_or_else(|| format!("Hook not found: {}", hook_name))?;

    let hook_path = PathBuf::from(&hook.path);

    // Execute hook
    exec_hook(&hook_path, &data)
}
