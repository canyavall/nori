pub mod executor;
pub mod commands;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HookInfo {
    pub name: String,
    pub path: String,
    pub event: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HookResult {
    pub success: bool,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LifecycleEvent {
    UserPromptSubmit,
    PreToolUse,
    PostToolUse,
    SessionStart,
    SessionEnd,
}

impl LifecycleEvent {
    pub fn as_str(&self) -> &str {
        match self {
            LifecycleEvent::UserPromptSubmit => "UserPromptSubmit",
            LifecycleEvent::PreToolUse => "PreToolUse",
            LifecycleEvent::PostToolUse => "PostToolUse",
            LifecycleEvent::SessionStart => "SessionStart",
            LifecycleEvent::SessionEnd => "SessionEnd",
        }
    }
}
