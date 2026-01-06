use super::parser::{parse_knowledge_file, scan_knowledge_directory};
use super::{KnowledgeIndex, SearchQuery, SearchResult};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

/// Global knowledge index (initialized on first use)
static KNOWLEDGE_INDEX: Mutex<Option<KnowledgeIndex>> = Mutex::new(None);

/// Index all knowledge packages from specified vault path or default ~/.nori/knowledge/
#[tauri::command]
pub fn index_knowledge(vault_path: Option<String>) -> Result<usize, String> {
    let knowledge_dir = if let Some(path) = vault_path {
        PathBuf::from(path)
    } else {
        let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
        home_dir.join(".nori").join("knowledge")
    };

    let packages = scan_knowledge_directory(&knowledge_dir)?;
    let count = packages.len();

    let mut index = KnowledgeIndex::new();
    for package in packages {
        index.add_package(package);
    }

    let mut global_index = KNOWLEDGE_INDEX.lock().map_err(|e| format!("Lock error: {}", e))?;
    *global_index = Some(index);

    println!("Indexed {} knowledge packages from {:?}", count, knowledge_dir);
    Ok(count)
}

/// Search knowledge packages
#[tauri::command]
pub fn search_knowledge(query: SearchQuery) -> Result<Vec<SearchResult>, String> {
    let global_index = KNOWLEDGE_INDEX.lock().map_err(|e| format!("Lock error: {}", e))?;

    let index = global_index
        .as_ref()
        .ok_or("Knowledge not indexed yet. Call index_knowledge first.")?;

    Ok(index.search(&query))
}

/// Get a specific package by name
#[tauri::command]
pub fn get_package(name: String) -> Result<super::Package, String> {
    let global_index = KNOWLEDGE_INDEX.lock().map_err(|e| format!("Lock error: {}", e))?;

    let index = global_index
        .as_ref()
        .ok_or("Knowledge not indexed yet. Call index_knowledge first.")?;

    index
        .packages
        .get(&name)
        .cloned()
        .ok_or_else(|| format!("Package not found: {}", name))
}

/// Get all categories
#[tauri::command]
pub fn get_categories() -> Result<Vec<String>, String> {
    let global_index = KNOWLEDGE_INDEX.lock().map_err(|e| format!("Lock error: {}", e))?;

    let index = global_index
        .as_ref()
        .ok_or("Knowledge not indexed yet. Call index_knowledge first.")?;

    Ok(index.get_categories())
}

/// Get all tags
#[tauri::command]
pub fn get_tags() -> Result<Vec<String>, String> {
    let global_index = KNOWLEDGE_INDEX.lock().map_err(|e| format!("Lock error: {}", e))?;

    let index = global_index
        .as_ref()
        .ok_or("Knowledge not indexed yet. Call index_knowledge first.")?;

    Ok(index.get_tags())
}

/// Save a knowledge package to specified vault or default location
#[tauri::command]
pub fn save_package(name: String, content: String, vault_path: Option<String>) -> Result<(), String> {
    let knowledge_dir = if let Some(path) = vault_path.clone() {
        PathBuf::from(path)
    } else {
        let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
        home_dir.join(".nori").join("knowledge")
    };

    // Parse content to extract category from frontmatter
    let temp_path = std::env::temp_dir().join(format!("{}.md", name));
    fs::write(&temp_path, &content).map_err(|e| format!("Failed to write temp file: {}", e))?;

    let package = parse_knowledge_file(&temp_path).map_err(|e| {
        let _ = fs::remove_file(&temp_path);
        format!("Invalid package format: {}", e)
    })?;

    let _ = fs::remove_file(&temp_path);

    // Save to category folder
    let category_dir = knowledge_dir.join(&package.category);
    fs::create_dir_all(&category_dir)
        .map_err(|e| format!("Failed to create category dir: {}", e))?;

    let file_path = category_dir.join(format!("{}.md", name));
    fs::write(&file_path, content).map_err(|e| format!("Failed to save package: {}", e))?;

    println!("Saved package: {} to {:?}", name, file_path);

    // Re-index with same vault path
    index_knowledge(vault_path)?;

    Ok(())
}

/// Validate a knowledge package
#[tauri::command]
pub fn validate_package(content: String) -> Result<bool, String> {
    let temp_path = std::env::temp_dir().join("validation_temp.md");
    fs::write(&temp_path, &content).map_err(|e| format!("Failed to write temp file: {}", e))?;

    let result = parse_knowledge_file(&temp_path);
    let _ = fs::remove_file(&temp_path);

    match result {
        Ok(package) => {
            // Check required fields
            if package.category.is_empty() {
                return Err("Category is required".to_string());
            }
            if package.description.is_empty() {
                return Err("Description is required".to_string());
            }
            if package.tags.is_empty() {
                return Err("At least one tag is required".to_string());
            }
            Ok(true)
        }
        Err(e) => Err(format!("Validation failed: {}", e)),
    }
}

/// Get all indexed packages
#[tauri::command]
pub fn get_all_packages() -> Result<Vec<super::Package>, String> {
    let global_index = KNOWLEDGE_INDEX.lock().map_err(|e| format!("Lock error: {}", e))?;

    let index = global_index
        .as_ref()
        .ok_or("Knowledge not indexed yet. Call index_knowledge first.")?;

    Ok(index.packages.values().cloned().collect())
}
