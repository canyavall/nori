pub mod commands;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String, // "user" or "assistant"
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatContext {
    pub system_prompt: String,
    pub messages: Vec<Message>,
    pub max_tokens: usize,
    pub temperature: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunk {
    pub content: String,
    pub finished: bool,
}

impl Default for ChatContext {
    fn default() -> Self {
        Self {
            system_prompt: String::new(),
            messages: Vec::new(),
            max_tokens: 4096,
            temperature: 1.0,
        }
    }
}
