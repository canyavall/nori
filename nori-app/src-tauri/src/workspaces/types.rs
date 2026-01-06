use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub vault: Option<String>,
    pub vault_path: Option<String>,
    pub created_at: i64,
    pub last_opened_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateWorkspaceInput {
    pub path: String,
    pub vault: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateWorkspaceVaultInput {
    pub workspace_id: i64,
    pub vault: String,
    pub vault_path: String,
}
