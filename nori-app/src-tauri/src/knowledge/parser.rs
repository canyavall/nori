use super::Package;
use regex::Regex;
use serde_yaml;
use std::fs;
use std::path::PathBuf;

const FRONTMATTER_REGEX: &str = r"^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$";

#[derive(Debug, serde::Deserialize)]
struct Frontmatter {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    category: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default)]
    used_by_agents: Vec<String>,
    #[serde(default)]
    required_knowledge: Vec<String>,
}

/// Parse a markdown file with YAML frontmatter
pub fn parse_knowledge_file(file_path: &PathBuf) -> Result<Package, String> {
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read file {:?}: {}", file_path, e))?;

    let re = Regex::new(FRONTMATTER_REGEX).map_err(|e| format!("Regex error: {}", e))?;

    let captures = re
        .captures(&content)
        .ok_or_else(|| format!("No frontmatter found in {:?}", file_path))?;

    let frontmatter_str = captures
        .get(1)
        .ok_or("Failed to extract frontmatter")?
        .as_str();
    let markdown_content = captures
        .get(2)
        .ok_or("Failed to extract markdown content")?
        .as_str();

    let frontmatter: Frontmatter = serde_yaml::from_str(frontmatter_str)
        .map_err(|e| format!("Failed to parse YAML: {}", e))?;

    // Extract name from filename if not in frontmatter
    let name = frontmatter.name.unwrap_or_else(|| {
        file_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_string()
    });

    // Extract category from path if not in frontmatter
    let category = frontmatter.category.unwrap_or_else(|| {
        file_path
            .parent()
            .and_then(|p| p.file_name())
            .and_then(|s| s.to_str())
            .unwrap_or("uncategorized")
            .to_string()
    });

    Ok(Package {
        name,
        category,
        description: frontmatter.description.unwrap_or_default(),
        tags: frontmatter.tags,
        used_by_agents: frontmatter.used_by_agents,
        required_knowledge: frontmatter.required_knowledge,
        knowledge_path: file_path.clone(),
        content: markdown_content.to_string(),
    })
}

/// Scan directory recursively for markdown files
pub fn scan_knowledge_directory(dir_path: &PathBuf) -> Result<Vec<Package>, String> {
    if !dir_path.exists() {
        return Ok(Vec::new());
    }

    let mut packages = Vec::new();

    for entry in walkdir::WalkDir::new(dir_path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            match parse_knowledge_file(&path.to_path_buf()) {
                Ok(package) => packages.push(package),
                Err(e) => {
                    eprintln!("Warning: Failed to parse {:?}: {}", path, e);
                    // Continue processing other files
                }
            }
        }
    }

    Ok(packages)
}
