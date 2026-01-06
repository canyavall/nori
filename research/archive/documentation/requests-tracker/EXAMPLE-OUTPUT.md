# Example Output - What You'll See

## 1. Capture Process (Terminal 1)

```
================================================================================
CLAUDE CODE REQUEST INTERCEPTOR
================================================================================

This will capture ALL API requests from Claude Code to Anthropic's API.
You'll be able to see:
  - Complete system prompts
  - CLAUDE.md content (if loaded)
  - Skills and rules configuration
  - Tool definitions
  - Request/response bodies

Capture will be saved to: captures/claude_requests_20251213_103000.mitm

================================================================================
SETUP INSTRUCTIONS:
================================================================================

1. First time only: Install mitmproxy certificate
   - Open browser and go to: http://mitm.it
   - Download and install the certificate for your OS

2. In ANOTHER terminal, run Claude Code through the proxy:

   Windows (PowerShell):
     $env:HTTPS_PROXY='http://localhost:8080'
     claude -p "your prompt here"

3. All requests will appear in this window

4. Press 'q' to quit and save the capture

================================================================================

Press ENTER to start capturing...

[mitmproxy interface shows]

GET http://mitm.it/cert/pem
    ← 200 OK text/html 1.2kB

POST https://api.anthropic.com/v1/messages
    ← 200 OK application/json 45kB

[Press 'q' to quit]

Capture saved to: captures/claude_requests_20251213_103000.mitm

To analyze the captured requests, run:
  python C:\...\requests_tracker/scripts/analyze-capture.py captures/claude_requests_20251213_103000.mitm
```

## 2. Running Claude Code (Terminal 2)

```powershell
PS C:\projects> $env:HTTPS_PROXY='http://localhost:8080'
PS C:\projects> claude -p "Explain how CLAUDE.md works"

Claude Code is processing your request...

CLAUDE.md is a special configuration file that provides project-specific
instructions to Claude Code. It works by...

[Claude's response continues...]
```

## 3. Analysis Output

```bash
$ python scripts/analyze-capture.py captures/claude_requests_20251213_103000.mitm

================================================================================
ANALYZING CLAUDE CODE API REQUESTS
================================================================================
Input: captures/claude_requests_20251213_103000.mitm
Output: analysis/claude_requests_20251213_103000

================================================================================
REQUEST #1
================================================================================
Timestamp: 2025-12-13 10:30:05.123456
Model: claude-sonnet-4-20250514
Max Tokens: 4096
Temperature: 1.0
  ✅ Found main system prompt (52341 chars)
  ✅ Found CLAUDE.md content (1823 chars)
  🔧 15 tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, ...
  💾 Saved detailed analysis to: request_001.txt

================================================================================
ANALYSIS COMPLETE
================================================================================
Total requests analyzed: 1
Output directory: analysis/claude_requests_20251213_103000
```

## 4. Detailed Request Analysis (request_001.txt)

```
REQUEST #1
================================================================================

Timestamp: 2025-12-13 10:30:05
Model: claude-sonnet-4-20250514
Max Tokens: 4096
Temperature: 1.0

================================================================================
SYSTEM PROMPT (3 blocks)
================================================================================

--- System Block 1 ---
Cache Control: ephemeral

⭐ MAIN SYSTEM PROMPT

You are Claude Code, Anthropic's official CLI for Claude.
You are an interactive CLI tool that helps users with software engineering tasks.

[... FULL SYSTEM PROMPT HERE - 50KB+ ...]

Your output will be displayed on a command line interface. Your responses should
be short and concise. You can use Github-flavored markdown for formatting...

[... continues with detailed instructions ...]


--- System Block 2 ---
Cache Control: ephemeral

📄 CLAUDE.MD CONTENT

# Project Instructions

This is my project's CLAUDE.md file with specific coding guidelines.

## Code Style
- Use TypeScript with strict mode
- Prefer functional components in React
- Write tests for all public APIs

## Architecture
- Follow clean architecture principles
- Separate business logic from UI
- Use dependency injection

[... rest of your CLAUDE.md ...]


--- System Block 3 ---
Cache Control: ephemeral

🎯 SKILL DEFINITION

---
name: react-best-practices
description: This skill should be used when working with React components...
---

When building React components, follow these patterns:
1. Use hooks instead of class components
2. Memoize expensive calculations
3. Implement error boundaries

[... skill content continues ...]


================================================================================
MESSAGES (1 messages)
================================================================================

--- Message 1 (user) ---

Explain how CLAUDE.md works


================================================================================
TOOLS (15 tools)
================================================================================

Registered tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch,
Task, TodoRead, TodoWrite, EnterPlanMode, ExitPlanMode, AskUserQuestion,
SlashCommand

================================================================================
FULL REQUEST JSON
================================================================================

{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4096,
  "temperature": 1.0,
  "system": [
    {
      "type": "text",
      "text": "You are Claude Code, Anthropic's official CLI...",
      "cache_control": {"type": "ephemeral"}
    },
    {
      "type": "text",
      "text": "# Project Instructions\n\nThis is my project's...",
      "cache_control": {"type": "ephemeral"}
    },
    {
      "type": "text",
      "text": "---\nname: react-best-practices...",
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "Explain how CLAUDE.md works"
    }
  ],
  "tools": [
    {
      "name": "Read",
      "description": "Reads a file from the local filesystem...",
      "input_schema": {
        "type": "object",
        "properties": {
          "file_path": {
            "type": "string",
            "description": "The absolute path to the file to read"
          }
        },
        "required": ["file_path"]
      }
    },
    ... (14 more tools)
  ]
}
```

## 5. What This Reveals

### ✅ CLAUDE.md IS Loading

System Block 2 shows your CLAUDE.md content is being injected into the system prompt!

### ✅ Skills ARE Activating

System Block 3 shows the skill was loaded for this request.

### ✅ Cache Control in Use

All system blocks have `"cache_control": {"type": "ephemeral"}` - Anthropic is using prompt caching.

### ✅ System Prompt Structure

You can now see:
1. Main instructions (Block 1) - ~50KB
2. Project context (Block 2) - Your CLAUDE.md
3. Skills (Block 3) - When activated
4. Tools available - 15 standard tools

### ⚠️ What You Might Find

If CLAUDE.md ISN'T working:
- System Block 2 would be missing or empty
- You'd only see Block 1 (main prompt)

If Skills AREN'T working:
- System Block 3 would be missing
- No skill content in system prompt

## 6. Testing Scenarios

### Scenario 1: CLAUDE.md Test

```bash
# Create obvious test
echo "ALWAYS START RESPONSES WITH: [CLAUDE_MD_TEST]" > CLAUDE.md

# Capture request
HTTPS_PROXY=http://localhost:8080 claude -p "Hello"

# Check analysis
grep -r "CLAUDE_MD_TEST" analysis/*/request_001.txt
```

**Expected**: Should find the text in System Block 2
**If not found**: CLAUDE.md not loading properly

### Scenario 2: Skills Test

```bash
# Create test skill
mkdir -p .claude/skills/always-active
cat > .claude/skills/always-active/SKILL.md << 'EOF'
---
name: always-active
description: Always load this skill
---
SKILL_WAS_LOADED_TEST
EOF

# Capture request
HTTPS_PROXY=http://localhost:8080 claude -p "Hello"

# Check analysis
grep -r "SKILL_WAS_LOADED_TEST" analysis/*/request_001.txt
```

**Expected**: Should find in System Block 3
**If not found**: Skills not activating

### Scenario 3: Compare Simple vs Complex

**Simple request**:
```bash
HTTPS_PROXY=http://localhost:8080 claude -p "Say hello"
# Saves to request_001.txt
```

**Complex request**:
```bash
HTTPS_PROXY=http://localhost:8080 claude -p "Implement OAuth authentication with JWT"
# Saves to request_002.txt
```

**Compare**:
- System prompt differences
- Number of system blocks
- Which skills activate
- Tool list changes

## 7. Key Insights You'll Gain

After analyzing 5-10 requests, you'll understand:

1. **System Prompt Engineering**
   - How Anthropic structures instructions
   - What makes good coding prompts
   - Task decomposition patterns

2. **CLAUDE.md Behavior**
   - When it loads (always? conditionally?)
   - How content is formatted
   - Character limits (if any)

3. **Skills System**
   - Activation triggers
   - How skills are injected
   - Skill content structure

4. **Rules Implementation**
   - How many files actually load
   - Format and structure
   - 20-file limit confirmation

5. **Context Management**
   - Cache control strategy
   - What gets cached vs. sent fresh
   - System prompt size limits

## Ready to Start?

Follow **QUICK-START.md** for step-by-step instructions!
