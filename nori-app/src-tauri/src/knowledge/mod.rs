pub mod commands;
pub mod parser;
pub mod search;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Package {
    pub name: String,
    pub category: String,
    pub description: String,
    pub tags: Vec<String>,
    pub used_by_agents: Vec<String>,
    pub required_knowledge: Vec<String>,
    pub knowledge_path: PathBuf,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeIndex {
    pub packages: HashMap<String, Package>,
    pub total_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub tags: Option<Vec<String>>,
    pub text: Option<String>,
    pub category: Option<String>,
    pub max_results: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub package: Package,
    pub relevance_score: f32,
}

impl KnowledgeIndex {
    pub fn new() -> Self {
        Self {
            packages: HashMap::new(),
            total_count: 0,
        }
    }

    pub fn add_package(&mut self, package: Package) {
        self.packages.insert(package.name.clone(), package);
        self.total_count = self.packages.len();
    }
}
