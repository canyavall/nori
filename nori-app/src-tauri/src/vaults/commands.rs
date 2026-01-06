use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use super::types::{CreateVaultInput, Vault, VaultConfig};

fn current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

fn get_config_path() -> Result<std::path::PathBuf, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    Ok(home_dir.join(".nori").join("config.json"))
}

fn load_config() -> Result<VaultConfig, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        return Ok(VaultConfig { vaults: vec![] });
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))
}

fn save_config(config: &VaultConfig) -> Result<(), String> {
    let config_path = get_config_path()?;

    // Ensure .nori directory exists
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create .nori directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))
}

fn validate_vault_name(name: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Vault name cannot be empty".to_string());
    }

    if name.contains(|c: char| !c.is_alphanumeric() && c != '-' && c != '_') {
        return Err("Vault name can only contain letters, numbers, hyphens, and underscores".to_string());
    }

    Ok(())
}

fn validate_vault_path(path: &str) -> Result<String, String> {
    let path_obj = Path::new(path);

    if !path_obj.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !path_obj.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let canonical_path = path_obj
        .canonicalize()
        .map_err(|e| format!("Failed to resolve path: {}", e))?;

    Ok(canonical_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn list_vaults() -> Result<Vec<Vault>, String> {
    let config = load_config()?;
    Ok(config.vaults)
}

#[tauri::command]
pub async fn create_vault(input: CreateVaultInput) -> Result<Vault, String> {
    validate_vault_name(&input.name)?;
    let canonical_path = validate_vault_path(&input.path)?;

    let mut config = load_config()?;

    // Check for duplicate name
    if config.vaults.iter().any(|v| v.name == input.name) {
        return Err(format!("Vault with name '{}' already exists", input.name));
    }

    // Check for duplicate path
    if config.vaults.iter().any(|v| v.path == canonical_path) {
        return Err(format!("Vault at path '{}' already exists", canonical_path));
    }

    let vault = Vault {
        name: input.name,
        path: canonical_path,
        created_at: current_timestamp(),
    };

    config.vaults.push(vault.clone());
    save_config(&config)?;

    Ok(vault)
}

#[tauri::command]
pub async fn delete_vault(name: String) -> Result<(), String> {
    let mut config = load_config()?;

    let original_len = config.vaults.len();
    config.vaults.retain(|v| v.name != name);

    if config.vaults.len() == original_len {
        return Err(format!("Vault '{}' not found", name));
    }

    save_config(&config)?;
    Ok(())
}

#[tauri::command]
pub async fn get_vault(name: String) -> Result<Option<Vault>, String> {
    let config = load_config()?;
    Ok(config.vaults.into_iter().find(|v| v.name == name))
}
