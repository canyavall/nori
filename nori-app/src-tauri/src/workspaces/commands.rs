use rusqlite::{Connection, OptionalExtension};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use super::types::{CreateWorkspaceInput, UpdateWorkspaceVaultInput, Workspace};

fn get_db_connection() -> Result<Connection, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let db_path = home_dir.join(".nori").join("nori.db");
    Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))
}

fn current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

fn validate_workspace_path(path: &str) -> Result<String, String> {
    let path_obj = Path::new(path);

    if !path_obj.exists() {
        return Err(format!("Folder does not exist: {}", path));
    }

    if !path_obj.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    // Note: Removed readonly check as it's unreliable on Windows
    // Write permission will be validated when actually creating files

    let canonical_path = path_obj
        .canonicalize()
        .map_err(|e| format!("Failed to resolve path: {}", e))?;

    Ok(canonical_path.to_string_lossy().to_string())
}

fn derive_workspace_name(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unnamed Workspace")
        .to_string()
}

#[tauri::command]
pub async fn list_workspaces() -> Result<Vec<Workspace>, String> {
    let conn = get_db_connection()?;

    let mut stmt = conn
        .prepare("SELECT id, name, path, vault, vault_path, created_at, last_opened_at FROM workspaces ORDER BY last_opened_at DESC")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let workspaces = stmt
        .query_map([], |row| {
            Ok(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                vault: row.get(3)?,
                vault_path: row.get(4)?,
                created_at: row.get(5)?,
                last_opened_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("Failed to query workspaces: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to parse workspaces: {}", e))?;

    Ok(workspaces)
}

#[tauri::command]
pub async fn create_workspace(input: CreateWorkspaceInput) -> Result<Workspace, String> {
    let canonical_path = validate_workspace_path(&input.path)?;
    let name = derive_workspace_name(&canonical_path);
    let timestamp = current_timestamp();

    let conn = get_db_connection()?;

    let existing: Option<i64> = conn
        .query_row(
            "SELECT id FROM workspaces WHERE path = ?1",
            [&canonical_path],
            |row| row.get(0),
        )
        .ok();

    if existing.is_some() {
        return Err(format!("Workspace already exists: {}", canonical_path));
    }

    // Get vault path if vault name provided
    let vault_path = if let Some(ref vault_name) = input.vault {
        // Load vault config to get path
        match crate::vaults::commands::get_vault(vault_name.clone()).await? {
            Some(vault) => Some(vault.path),
            None => return Err(format!("Vault '{}' not found", vault_name)),
        }
    } else {
        None
    };

    conn.execute(
        "INSERT INTO workspaces (name, path, vault, vault_path, created_at, last_opened_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        (&name, &canonical_path, &input.vault, &vault_path, &timestamp, &timestamp),
    )
    .map_err(|e| format!("Failed to create workspace: {}", e))?;

    let workspace_id = conn.last_insert_rowid();

    Ok(Workspace {
        id: workspace_id,
        name,
        path: canonical_path,
        vault: input.vault,
        vault_path,
        created_at: timestamp,
        last_opened_at: timestamp,
    })
}

#[tauri::command]
pub async fn get_active_workspace() -> Result<Option<Workspace>, String> {
    let conn = get_db_connection()?;

    let active_id: Result<Option<i64>, _> = conn.query_row(
        "SELECT active_workspace_id FROM app_state WHERE id = 1",
        [],
        |row| row.get(0),
    );

    match active_id {
        Ok(Some(id)) => {
            let workspace = conn
                .query_row(
                    "SELECT id, name, path, vault, vault_path, created_at, last_opened_at FROM workspaces WHERE id = ?1",
                    [id],
                    |row| {
                        Ok(Workspace {
                            id: row.get(0)?,
                            name: row.get(1)?,
                            path: row.get(2)?,
                            vault: row.get(3)?,
                            vault_path: row.get(4)?,
                            created_at: row.get(5)?,
                            last_opened_at: row.get(6)?,
                        })
                    },
                )
                .map_err(|e| format!("Failed to get active workspace: {}", e))?;
            Ok(Some(workspace))
        }
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to query active workspace: {}", e)),
    }
}

#[tauri::command]
pub async fn set_active_workspace(workspace_id: i64) -> Result<(), String> {
    let conn = get_db_connection()?;
    let timestamp = current_timestamp();

    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM workspaces WHERE id = ?1",
            [workspace_id],
            |row| {
                let count: i64 = row.get(0)?;
                Ok(count > 0)
            },
        )
        .map_err(|e| format!("Failed to check workspace existence: {}", e))?;

    if !exists {
        return Err(format!("Workspace not found: {}", workspace_id));
    }

    conn.execute(
        "UPDATE workspaces SET last_opened_at = ?1 WHERE id = ?2",
        (timestamp, workspace_id),
    )
    .map_err(|e| format!("Failed to update workspace: {}", e))?;

    conn.execute(
        "INSERT OR REPLACE INTO app_state (id, active_workspace_id) VALUES (1, ?1)",
        [workspace_id],
    )
    .map_err(|e| format!("Failed to set active workspace: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_workspace_by_path(path: String) -> Result<Option<Workspace>, String> {
    let conn = get_db_connection()?;

    let workspace = conn
        .query_row(
            "SELECT id, name, path, vault, vault_path, created_at, last_opened_at FROM workspaces WHERE path = ?1",
            [&path],
            |row| {
                Ok(Workspace {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    path: row.get(2)?,
                    vault: row.get(3)?,
                    vault_path: row.get(4)?,
                    created_at: row.get(5)?,
                    last_opened_at: row.get(6)?,
                })
            },
        )
        .optional()
        .map_err(|e| format!("Failed to get workspace: {}", e))?;

    Ok(workspace)
}

#[tauri::command]
pub async fn update_workspace_vault(input: UpdateWorkspaceVaultInput) -> Result<(), String> {
    let conn = get_db_connection()?;

    // Verify workspace exists
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM workspaces WHERE id = ?1",
            [input.workspace_id],
            |row| {
                let count: i64 = row.get(0)?;
                Ok(count > 0)
            },
        )
        .map_err(|e| format!("Failed to check workspace existence: {}", e))?;

    if !exists {
        return Err(format!("Workspace not found: {}", input.workspace_id));
    }

    // Verify vault exists
    if crate::vaults::commands::get_vault(input.vault.clone()).await?.is_none() {
        return Err(format!("Vault '{}' not found", input.vault));
    }

    conn.execute(
        "UPDATE workspaces SET vault = ?1, vault_path = ?2 WHERE id = ?3",
        (&input.vault, &input.vault_path, input.workspace_id),
    )
    .map_err(|e| format!("Failed to update workspace vault: {}", e))?;

    Ok(())
}
