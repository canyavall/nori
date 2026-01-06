use rusqlite::Connection;
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use super::types::{CreateProjectInput, Project};

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

fn validate_project_path(path: &str) -> Result<String, String> {
    let path_obj = Path::new(path);

    if !path_obj.exists() {
        return Err(format!("Folder does not exist: {}", path));
    }

    if !path_obj.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    if fs::metadata(path).map(|m| m.permissions().readonly()).unwrap_or(true) {
        return Err(format!("Folder is not writable: {}", path));
    }

    let canonical_path = path_obj
        .canonicalize()
        .map_err(|e| format!("Failed to resolve path: {}", e))?;

    Ok(canonical_path.to_string_lossy().to_string())
}

fn derive_project_name(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unnamed Project")
        .to_string()
}

#[tauri::command]
pub async fn list_projects() -> Result<Vec<Project>, String> {
    let conn = get_db_connection()?;

    let mut stmt = conn
        .prepare("SELECT id, name, path, created_at, last_opened_at FROM projects ORDER BY last_opened_at DESC")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                created_at: row.get(3)?,
                last_opened_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query projects: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to parse projects: {}", e))?;

    Ok(projects)
}

#[tauri::command]
pub async fn create_project(input: CreateProjectInput) -> Result<Project, String> {
    let canonical_path = validate_project_path(&input.path)?;
    let name = derive_project_name(&canonical_path);
    let timestamp = current_timestamp();

    let conn = get_db_connection()?;

    let existing: Option<i64> = conn
        .query_row(
            "SELECT id FROM projects WHERE path = ?1",
            [&canonical_path],
            |row| row.get(0),
        )
        .ok();

    if existing.is_some() {
        return Err(format!("Project already exists: {}", canonical_path));
    }

    conn.execute(
        "INSERT INTO projects (name, path, created_at, last_opened_at) VALUES (?1, ?2, ?3, ?4)",
        (&name, &canonical_path, &timestamp, &timestamp),
    )
    .map_err(|e| format!("Failed to create project: {}", e))?;

    let project_id = conn.last_insert_rowid();

    Ok(Project {
        id: project_id,
        name,
        path: canonical_path,
        created_at: timestamp,
        last_opened_at: timestamp,
    })
}

#[tauri::command]
pub async fn get_active_project() -> Result<Option<Project>, String> {
    let conn = get_db_connection()?;

    let active_id: Result<Option<i64>, _> = conn.query_row(
        "SELECT active_project_id FROM app_state WHERE id = 1",
        [],
        |row| row.get(0),
    );

    match active_id {
        Ok(Some(id)) => {
            let project = conn
                .query_row(
                    "SELECT id, name, path, created_at, last_opened_at FROM projects WHERE id = ?1",
                    [id],
                    |row| {
                        Ok(Project {
                            id: row.get(0)?,
                            name: row.get(1)?,
                            path: row.get(2)?,
                            created_at: row.get(3)?,
                            last_opened_at: row.get(4)?,
                        })
                    },
                )
                .map_err(|e| format!("Failed to get active project: {}", e))?;
            Ok(Some(project))
        }
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to query active project: {}", e)),
    }
}

#[tauri::command]
pub async fn set_active_project(project_id: i64) -> Result<(), String> {
    let conn = get_db_connection()?;
    let timestamp = current_timestamp();

    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM projects WHERE id = ?1",
            [project_id],
            |row| {
                let count: i64 = row.get(0)?;
                Ok(count > 0)
            },
        )
        .map_err(|e| format!("Failed to check project existence: {}", e))?;

    if !exists {
        return Err(format!("Project not found: {}", project_id));
    }

    conn.execute(
        "UPDATE projects SET last_opened_at = ?1 WHERE id = ?2",
        (timestamp, project_id),
    )
    .map_err(|e| format!("Failed to update project: {}", e))?;

    conn.execute(
        "INSERT OR REPLACE INTO app_state (id, active_project_id) VALUES (1, ?1)",
        [project_id],
    )
    .map_err(|e| format!("Failed to set active project: {}", e))?;

    Ok(())
}
