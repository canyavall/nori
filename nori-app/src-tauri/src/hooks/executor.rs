use super::{HookInfo, HookResult};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Duration;

const HOOK_TIMEOUT_SECS: u64 = 30;

/// Scan .nori/hooks/ directory for hook files
pub fn scan_hooks(hooks_dir: &PathBuf) -> Result<Vec<HookInfo>, String> {
    if !hooks_dir.exists() {
        return Ok(Vec::new());
    }

    let mut hooks = Vec::new();

    for entry in fs::read_dir(hooks_dir).map_err(|e| format!("Failed to read hooks dir: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy();
                if matches!(ext_str.as_ref(), "mjs" | "js" | "sh" | "py" | "exe") {
                    let name = path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("unknown")
                        .to_string();

                    // Extract event from filename (e.g., "user-prompt-submit.mjs" -> "UserPromptSubmit")
                    let event = extract_event_from_filename(&name);

                    hooks.push(HookInfo {
                        name: name.clone(),
                        path: path.to_string_lossy().to_string(),
                        event,
                        enabled: true, // TODO: Read from config
                    });
                }
            }
        }
    }

    Ok(hooks)
}

/// Extract lifecycle event from hook filename
fn extract_event_from_filename(filename: &str) -> String {
    if filename.contains("user-prompt-submit") || filename.contains("prompt") {
        "UserPromptSubmit".to_string()
    } else if filename.contains("pre-tool-use") {
        "PreToolUse".to_string()
    } else if filename.contains("post-tool-use") {
        "PostToolUse".to_string()
    } else if filename.contains("session-start") {
        "SessionStart".to_string()
    } else if filename.contains("session-end") {
        "SessionEnd".to_string()
    } else {
        "Unknown".to_string()
    }
}

/// Execute a hook with JSON input
pub fn execute_hook(
    hook_path: &PathBuf,
    input_data: &serde_json::Value,
) -> Result<HookResult, String> {
    let ext = hook_path
        .extension()
        .and_then(|s| s.to_str())
        .ok_or("Hook has no extension")?;

    let mut cmd = match ext {
        "mjs" | "js" => {
            let mut c = Command::new("node");
            c.arg(hook_path);
            c
        }
        "sh" => {
            let mut c = if cfg!(windows) {
                Command::new("bash")
            } else {
                Command::new("sh")
            };
            c.arg(hook_path);
            c
        }
        "py" => {
            let mut c = Command::new("python");
            c.arg(hook_path);
            c
        }
        "exe" => {
            let mut c = Command::new(hook_path);
            c
        }
        _ => return Err(format!("Unsupported hook extension: {}", ext)),
    };

    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn hook process: {}", e))?;

    // Write JSON to stdin
    if let Some(mut stdin) = child.stdin.take() {
        let json_str = serde_json::to_string(input_data)
            .map_err(|e| format!("Failed to serialize input: {}", e))?;
        stdin
            .write_all(json_str.as_bytes())
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
    }

    // Wait with timeout
    let output = match wait_timeout::ChildExt::wait_timeout(
        &mut child,
        Duration::from_secs(HOOK_TIMEOUT_SECS),
    ) {
        Ok(Some(status)) => {
            let stdout = child
                .stdout
                .take()
                .map(|mut s| {
                    let mut buf = String::new();
                    std::io::Read::read_to_string(&mut s, &mut buf).ok();
                    buf
                })
                .unwrap_or_default();

            let stderr = child
                .stderr
                .take()
                .map(|mut s| {
                    let mut buf = String::new();
                    std::io::Read::read_to_string(&mut s, &mut buf).ok();
                    buf
                })
                .unwrap_or_default();

            if status.success() {
                // Parse stdout as JSON if possible
                let output_json = serde_json::from_str(&stdout).ok();

                HookResult {
                    success: true,
                    output: output_json,
                    error: None,
                    stdout: stdout.clone(),
                    stderr,
                }
            } else {
                HookResult {
                    success: false,
                    output: None,
                    error: Some(format!("Hook exited with code: {:?}", status.code())),
                    stdout,
                    stderr,
                }
            }
        }
        Ok(None) => {
            // Timeout - kill the process
            let _ = child.kill();
            HookResult {
                success: false,
                output: None,
                error: Some(format!("Hook timed out after {}s", HOOK_TIMEOUT_SECS)),
                stdout: String::new(),
                stderr: String::new(),
            }
        }
        Err(e) => {
            return Err(format!("Failed to wait for hook: {}", e));
        }
    };

    Ok(output)
}

/// Copy example hooks to .nori/hooks/ on first run
pub fn init_example_hooks(hooks_dir: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    if !hooks_dir.exists() {
        fs::create_dir_all(hooks_dir)?;
    }

    // Create example UserPromptSubmit hook (Node.js)
    let example_hook = r#"#!/usr/bin/env node
// Example UserPromptSubmit hook
// Receives prompt via stdin, can modify and return via stdout

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let inputData = '';

rl.on('line', (line) => {
  inputData += line;
});

rl.on('close', () => {
  try {
    const data = JSON.parse(inputData);

    // Example: Add timestamp to prompt
    const modifiedPrompt = `[${new Date().toISOString()}] ${data.prompt}`;

    // Return modified data
    const result = {
      ...data,
      prompt: modifiedPrompt
    };

    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    console.error('Hook error:', err.message);
    process.exit(1);
  }
});
"#;

    let example_path = hooks_dir.join("example-user-prompt-submit.mjs");
    if !example_path.exists() {
        fs::write(&example_path, example_hook)?;
        println!("Created example hook: {:?}", example_path);
    }

    Ok(())
}
