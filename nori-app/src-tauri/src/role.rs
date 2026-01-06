use std::fs;
use std::path::PathBuf;

/// Load personality template for a given role
#[tauri::command]
pub fn load_personality(role: String) -> Result<String, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let personality_path = home_dir
        .join(".nori")
        .join("personalities")
        .join(format!("{}.txt", role));

    if !personality_path.exists() {
        return Err(format!("Personality file not found for role: {}", role));
    }

    fs::read_to_string(&personality_path)
        .map_err(|e| format!("Failed to read personality file: {}", e))
}

/// Load role-specific knowledge packages (returns list of package paths)
#[tauri::command]
pub fn load_role_knowledge(role: String) -> Result<Vec<String>, String> {
    // For now, return empty list - will be implemented with knowledge system
    // In future, this will read from a mapping file or database
    Ok(vec![format!(
        "Knowledge packages for {} will be loaded here",
        role
    )])
}

/// Save active role to database
#[tauri::command]
pub fn save_active_role_backend(role: String) -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let db_path = home_dir.join(".nori").join("nori.db");

    let conn =
        rusqlite::Connection::open(&db_path).map_err(|e| format!("Database error: {}", e))?;

    crate::db::save_active_role(&conn, &role).map_err(|e| format!("Failed to save role: {}", e))
}

/// Initialize personality templates on first run
pub fn init_personalities(nori_dir: &std::path::Path) -> Result<(), Box<dyn std::error::Error>> {
    let personalities_dir = nori_dir.join("personalities");

    // Create default personality templates
    let templates = vec![
        (
            "po.txt",
            "You are a Product Owner focused on:\n\
             - User stories and acceptance criteria\n\
             - Business value and ROI\n\
             - Stakeholder communication\n\
             - Product backlog prioritization\n\
             - Feature requirements and specifications\n\n\
             Always think from the user's perspective and business impact.",
        ),
        (
            "architect.txt",
            "You are a Software Architect focused on:\n\
             - System design and architecture patterns\n\
             - Technical decisions and trade-offs\n\
             - Scalability and performance\n\
             - Integration and API design\n\
             - Technology stack selection\n\n\
             Always consider long-term maintainability and system evolution.",
        ),
        (
            "engineer.txt",
            "You are a Software Engineer focused on:\n\
             - Clean code and best practices\n\
             - Testing (unit, integration, e2e)\n\
             - Code reviews and quality\n\
             - Implementation patterns\n\
             - Debugging and problem-solving\n\n\
             Always write production-ready, maintainable code.",
        ),
        (
            "ciso.txt",
            "You are a Chief Information Security Officer focused on:\n\
             - Security vulnerabilities and threats\n\
             - Compliance and regulations\n\
             - Risk assessment and mitigation\n\
             - Data protection and privacy\n\
             - Security best practices\n\n\
             Always prioritize security and identify potential risks.",
        ),
        (
            "sre.txt",
            "You are a Site Reliability Engineer focused on:\n\
             - System reliability and uptime\n\
             - Monitoring and observability\n\
             - Performance optimization\n\
             - Infrastructure automation\n\
             - Incident response and troubleshooting\n\n\
             Always ensure systems are reliable, scalable, and observable.",
        ),
    ];

    for (filename, content) in templates {
        let file_path = personalities_dir.join(filename);
        if !file_path.exists() {
            fs::write(&file_path, content)?;
            println!("Created personality template: {}", filename);
        }
    }

    Ok(())
}
