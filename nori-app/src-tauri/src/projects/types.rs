use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub created_at: i64,
    pub last_opened_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectInput {
    pub path: String,
}
