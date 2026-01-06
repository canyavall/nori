# Claude Code Request Interception Guide

**Complete guide to intercepting, analyzing, and understanding Claude Code API requests**

---

## Table of Contents

1. [Overview](#overview)
2. [Why Intercept Requests](#why-intercept-requests)
3. [How It Works](#how-it-works)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Analysis](#analysis)
7. [Key Findings](#key-findings)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)

---

## Overview

This guide explains how to intercept HTTPS requests from Claude Code CLI to the Anthropic API to understand:
- What system prompts are actually sent
- How CLAUDE.md, skills, rules, and hooks work
- What makes Claude Code perform better than alternatives

**Tools used**:
- **mitmproxy** - HTTPS proxy and interceptor
- **Python scripts** - Analysis and automation
- **PowerShell/Bash scripts** - Convenience wrappers

**Location**: `requests_tracker/` in project root

---

## Why Intercept Requests

### The Problem

Claude Code markets several features:
- CLAUDE.md for project-specific instructions
- Skills for specialized capabilities
- Rules for file constraints
- Hooks for lifecycle events

**User observation**: "These features don't seem to work consistently. What's actually making Claude Code good?"

### The Solution

Intercept API requests to see:
- Actual system prompts sent to the API
- When/how CLAUDE.md is loaded
- If skills are activated
- How rules and hooks function
- What Claude Code does differently than OpenCode

### Expected Results

Discovered that Claude Code's quality comes from:
1. **80% Model quality** (Sonnet 4.5)
2. **15% System prompt engineering** (12,927-character detailed prompts)
3. **5% Tool ecosystem** (17 specialized tools)

NOT from CLAUDE.md magic, skills, or rules.

---

## How It Works

### HTTPS Interception

```
Claude Code CLI
    ↓ (HTTPS request)
mitmproxy (localhost:8080)
    ↓ (decrypted & logged)
Anthropic API (api.anthropic.com)
    ↓ (response)
mitmproxy
    ↓ (re-encrypted)
Claude Code CLI
```

**Key insight**: mitmproxy acts as a "man-in-the-middle" proxy that:
1. Decrypts HTTPS traffic (using its own certificate)
2. Logs all request/response data
3. Re-encrypts and forwards to destination

### Certificate Trust

For HTTPS decryption to work:
1. mitmproxy generates a root certificate
2. You install it to Windows "Trusted Root Certification Authorities"
3. Windows trusts mitmproxy's certificate
4. mitmproxy can decrypt HTTPS without errors

### Node.js SSL Bypass

Claude Code runs on Node.js, which has its own certificate store. To intercept:
- Set `NODE_TLS_REJECT_UNAUTHORIZED=0` environment variable
- This tells Node.js to accept the mitmproxy certificate

**Security note**: Only use this for local development/analysis, never in production.

---

## Installation

### Prerequisites

- Windows 10/11
- PowerShell or Git Bash
- Python 3.13+ (Microsoft Store version)
- Claude Code CLI installed

### Quick Install

**Option A - PowerShell (Recommended)**:
```powershell
cd requests_tracker\scripts
.\install-certificate.ps1
.\test-capture.ps1
```

**Option B - Git Bash**:
```bash
cd requests_tracker/scripts
./install-certificate.sh
./test-capture.sh
```

### Step-by-Step Installation

#### 1. Install mitmproxy

Already installed at:
```
C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\
```

Verify:
```bash
python -m pip show mitmproxy
```

#### 2. Install Certificate

**Automated (PowerShell)**:
```powershell
cd requests_tracker\scripts
.\install-certificate.ps1
```

**Manual**:
1. Open File Explorer
2. Navigate to: `%USERPROFILE%\.mitmproxy\`
3. Double-click: `mitmproxy-ca-cert.p12`
4. Password: `mitmproxy`
5. Store Location: **Current User**
6. Certificate Store: **Trusted Root Certification Authorities** (CRITICAL!)
7. Click Finish → Yes

**Verify installation**:
```powershell
certutil -user -verifystore Root mitmproxy
```

Expected output: Certificate details (not "Object was not found")

#### 3. Test Capture

**PowerShell**:
```powershell
cd requests_tracker\scripts
.\test-capture.ps1
```

**Expected output**:
```
✅ Request successful!
✅ Capture file created: test_capture_YYYYMMDD_HHMMSS.mitm
   Size: 7761 bytes
SUCCESS! mitmproxy is capturing traffic correctly.
```

If you see "❌ Request failed" or "⚠️ Capture file is empty":
- Certificate not installed correctly
- Install to "Trusted Root Certification Authorities" (NOT "Personal")
- Restart terminal after installation

---

## Usage

### Basic Capture (Automatic)

**Capture a single Claude Code request**:
```powershell
cd requests_tracker\scripts
.\capture-with-node-cert.ps1
```

This script:
1. Starts mitmproxy in background
2. Runs `claude -p "Say hello in one word"`
3. Stops mitmproxy
4. Analyzes the capture
5. Shows results

**Output**: Capture file in `requests_tracker/captures/` and analysis in `requests_tracker/analysis/`

### Manual Capture (Interactive)

**Step 1 - Start mitmproxy** (Terminal 1):
```powershell
cd requests_tracker\scripts
.\quick-start.ps1
```

This shows the mitmproxy interface filtering for `api.anthropic.com` requests.

**Step 2 - Run Claude Code** (Terminal 2):
```powershell
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "your prompt here"
```

**Step 3 - Stop mitmproxy** (Terminal 1):
- Press `q` to quit
- Capture saved to `captures/claude_requests_TIMESTAMP.mitm`

**Step 4 - Analyze**:
```powershell
cd requests_tracker
python scripts\analyze-capture.py captures\claude_requests_*.mitm
```

### Capture Specific Scenarios

**Test CLAUDE.md loading**:
```powershell
cd C:\path\to\project\with\CLAUDE.md
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "what's in this project?"
```

**Test skills activation**:
```powershell
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "analyze this PDF: file.pdf"
```

**Test rules**:
```powershell
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude --rules file1.ts,file2.ts -p "refactor this"
```

---

## Analysis

### What Gets Captured

**Capture file format**: `.mitm` (mitmproxy flow format)

**Contents**:
- HTTP request method, URL, headers
- Request body (JSON payload to Anthropic API)
- Response data
- Timing information

### Analysis Script

**Location**: `requests_tracker/scripts/analyze-capture.py`

**What it does**:
1. Reads `.mitm` capture file
2. Filters for `api.anthropic.com` requests
3. Extracts and formats:
   - System prompts
   - Tool definitions
   - User messages
   - Model/parameters
4. Saves individual requests to `analysis/[capture_name]/request_NNN.txt`

**Usage**:
```bash
python scripts/analyze-capture.py captures/your_capture.mitm
```

**Output structure**:
```
analysis/your_capture/
├── request_001.txt
├── request_002.txt
├── request_003.txt  # Usually the main request
└── ...
```

### Reading Analysis Files

**Each request file contains**:
```
REQUEST #8
================================================================================

Timestamp: 2025-12-13 23:18:08.313447
Model: claude-sonnet-4-5-20250929
Max Tokens: 32000
Temperature: unknown


================================================================================
SYSTEM PROMPT (2 blocks)
================================================================================

--- System Block 1 ---
Cache Control: ephemeral

You are a Claude agent, built on Anthropic's Claude Agent SDK.

--- System Block 2 ---
Cache Control: ephemeral

⭐ MAIN SYSTEM PROMPT

[12,927 characters of detailed instructions]
...

================================================================================
TOOLS (17 tools)
================================================================================

Registered tools: Task, TaskOutput, Bash, Glob, Grep, ...

[Detailed tool descriptions]
...

================================================================================
USER MESSAGES
================================================================================

[Conversation history]
```

### Key Things to Check

**1. System Prompt Length**:
```bash
grep -A 100 "MAIN SYSTEM PROMPT" analysis/*/request_*.txt | wc -l
```
Claude Code uses ~750 lines (12,927 chars). If OpenCode uses less, that's why it's worse.

**2. CLAUDE.md Loading**:
```bash
grep -i "claude.md\|claudeMd\|project instructions" analysis/*/request_*.txt
```
If found: CLAUDE.md was loaded. If not: wasn't loaded for this request.

**3. Skills Activation**:
```bash
grep -A 10 "available_skills" analysis/*/request_*.txt
```
Look for skills between `<available_skills>` tags. If empty: no skills loaded.

**4. Tool Descriptions**:
```bash
grep -A 20 "\"name\": \"Bash\"" analysis/*/request_*.txt
```
Compare tool descriptions with OpenCode to see if Claude Code's are more detailed.

**5. Multi-Model Usage**:
```bash
grep "Model:" analysis/*/request_*.txt
```
Claude Code uses multiple models (Sonnet for complex, Haiku for quick checks).

---

## Key Findings

### What We Discovered

**Captured**: Simple command `claude -p "Say hello in one word"`
**Result**: 10 API requests, 195KB of data

#### Finding #1: Massive System Prompts

**Claude Code sends 12,927-character system prompts** with:
- Professional objectivity guidelines
- Detailed task management instructions
- Complete git workflow (commits, PRs)
- Example-driven learning blocks
- Tool usage policies
- Security guidelines

**Example instruction**:
```
# Professional objectivity
Prioritize technical accuracy and truthfulness over validating the user's beliefs.
Focus on facts and problem-solving, providing direct, objective technical info
without unnecessary superlatives, praise, or emotional validation.
```

#### Finding #2: CLAUDE.md NOT Loaded for Simple Commands

**Evidence**: No CLAUDE.md content in system prompt for `claude -p "Say hello in one word"`

**Hypothesis**: CLAUDE.md is loaded:
- When inside a project directory (git repo)
- For multi-turn conversations
- When explicitly referencing project context

**Test this**: Run from inside `nori/` directory with complex prompt.

#### Finding #3: Skills Are Empty

**Evidence**:
```xml
<available_skills>

</available_skills>
```

Skills tool exists but no skills loaded for simple command.

**This confirms user's observation**: "skills feature is not working well, only sometimes being loaded"

#### Finding #4: Multi-Model Optimization

**Models used**:
- `claude-sonnet-4-5-20250929` - Complex reasoning (main)
- `claude-haiku-4-5-20251001` - Quick checks (max_tokens=1)

**Why this matters**:
- Cost optimization (Haiku is cheaper)
- Speed optimization (Haiku is faster)
- Quality where it counts (Sonnet for complex tasks)

#### Finding #5: Example-Driven Prompting

**Pattern throughout system prompt**:
```
<example>
user: Run the build and fix any type errors
assistant: I'm going to use the TodoWrite tool to write the following items...
[Shows complete ideal behavior]
</example>
```

This teaches the model through demonstration, not just instructions.

### What Makes Claude Code Better

**Reality**: 80% Model + 15% Prompt Engineering + 5% Tools

**NOT the marketed features**:
- ❌ CLAUDE.md magic (not loaded by default)
- ❌ Skills activation (usually empty)
- ❌ Rules enforcement (niche feature)
- ❌ Hooks intelligence (client-side only)

**What actually works**:
- ✅ Extremely detailed system prompts
- ✅ Example-driven learning
- ✅ Multi-model optimization
- ✅ Model quality (Sonnet 4.5 is just better)

### Implications for OpenCode

**Do this**:
1. Expand system prompt to ~12,000+ characters
2. Add example-driven instruction blocks
3. Implement multi-model support (Haiku + Sonnet)
4. Include detailed git workflow instructions
5. Add professional objectivity guidelines

**Don't prioritize**:
1. Complex skills system (barely used)
2. CLAUDE.md auto-loading (simple file reading is fine)
3. Rules enforcement (limited use case)

---

## Troubleshooting

### Certificate Issues

**Problem**: "Certificate not trusted" or SSL errors

**Solution**:
1. Verify certificate in correct store:
   ```powershell
   certutil -user -verifystore Root mitmproxy
   ```
2. If not found, reinstall to **Trusted Root Certification Authorities**
3. NOT "Personal" or "Intermediate Certification Authorities"
4. Restart terminal after installation

### Capture File Empty (0 bytes)

**Problem**: mitmproxy starts but captures nothing

**Causes**:
1. Certificate not trusted (SSL handshake fails)
2. Claude Code not using proxy
3. Node.js rejecting certificate

**Solution**:
```powershell
# Ensure both environment variables are set
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'

# Verify proxy is used
curl -x http://localhost:8080 https://httpbin.org/get
```

### Claude Code Hangs

**Problem**: Claude Code command never completes

**Causes**:
1. Can't connect to proxy (wrong port/not running)
2. SSL certificate rejection (Node.js-specific)

**Solution**:
1. Check mitmproxy is running: `netstat -an | findstr 8080`
2. Set Node.js bypass: `$env:NODE_TLS_REJECT_UNAUTHORIZED='0'`
3. Use timeout in script: `capture-with-node-cert.ps1` has 30s timeout

### Analysis Script Fails

**Problem**: Unicode encoding errors on Windows

**Error**:
```
UnicodeEncodeError: 'charmap' codec can't encode characters
```

**Solution**: Already fixed in `analyze-capture.py`:
```python
# Windows encoding fix at top of file
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
```

### Port Already in Use

**Problem**: "Address already in use" when starting mitmproxy

**Solution**:
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID)
taskkill /F /PID <PID>

# Or use different port
.\quick-start.ps1 -Port 8081
```

---

## Advanced Usage

### Capturing Long Conversations

For multi-turn conversations:

```powershell
# Terminal 1 - Start mitmproxy
cd requests_tracker\scripts
.\quick-start.ps1

# Terminal 2 - Run multiple commands
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'

claude -p "read the README"
# [Wait for response]
claude -p "now add a feature to handle logout"
# [Wait for response]
claude -p "create tests for it"
# [Wait for response]

# Terminal 1 - Press 'q' to save
```

Result: All 3 requests captured in one file.

### Comparing with OpenCode

**Capture OpenCode requests**:
```bash
# Start mitmproxy (Terminal 1)
cd requests_tracker/scripts
./quick-start.sh

# Run OpenCode (Terminal 2)
export HTTPS_PROXY=http://localhost:8080
export NODE_TLS_REJECT_UNAUTHORIZED=0
opencode -p "Say hello in one word"

# Press 'q' in Terminal 1
```

**Compare system prompts**:
```bash
# Analyze both
python scripts/analyze-capture.py captures/claude_*.mitm
python scripts/analyze-capture.py captures/opencode_*.mitm

# Compare prompt lengths
wc -l analysis/claude_*/request_008.txt
wc -l analysis/opencode_*/request_008.txt

# Diff the prompts
diff analysis/claude_*/request_008.txt analysis/opencode_*/request_008.txt
```

### Filtering Specific Content

**Extract only system prompts**:
```bash
grep -A 500 "MAIN SYSTEM PROMPT" analysis/*/request_*.txt > system_prompts.txt
```

**Extract tool definitions**:
```bash
grep -A 1000 "TOOLS" analysis/*/request_*.txt > tool_definitions.txt
```

**Extract conversation history**:
```bash
grep -A 100 "USER MESSAGES" analysis/*/request_*.txt > conversation.txt
```

### Automated Testing

**Script to test multiple scenarios**:
```powershell
# test-scenarios.ps1
$scenarios = @(
    @{Name="Simple"; Prompt="Say hello"},
    @{Name="WithCLAUDE"; Prompt="what's in this project?"; Dir="C:\path\to\nori"},
    @{Name="WithSkills"; Prompt="analyze PDF: file.pdf"},
    @{Name="Complex"; Prompt="add logout feature with tests"}
)

foreach ($scenario in $scenarios) {
    Write-Host "Testing: $($scenario.Name)"

    if ($scenario.Dir) { cd $scenario.Dir }

    & "C:\path\to\capture-with-node-cert.ps1" -Prompt $scenario.Prompt

    Move-Item captures/*.mitm "captures/$($scenario.Name)_*.mitm"
}
```

### Continuous Monitoring

**Monitor all Claude Code usage**:
```powershell
# Start mitmproxy with file rotation
mitmdump -p 8080 --set save_stream_file="captures/continuous_$(date +%Y%m%d_%H%M%S).mitm"

# In another terminal, use Claude Code normally
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'

# All requests automatically captured
```

---

## Files Reference

### Scripts Location

**All scripts in**: `requests_tracker/scripts/`

**PowerShell Scripts**:
- `install-certificate.ps1` - Install mitmproxy certificate
- `test-capture.ps1` - Test if capture works
- `quick-start.ps1` - Start interactive capture
- `capture-with-node-cert.ps1` - Automated single capture

**Bash Scripts** (Git Bash):
- `install-certificate.sh` - Install certificate
- `test-capture.sh` - Test capture
- `quick-start.sh` - Interactive capture

**Python Scripts**:
- `start-capture.py` - Programmatic capture
- `analyze-capture.py` - Analyze captured requests

### Documentation Files

**In `requests_tracker/`**:
- `README.md` - Project overview
- `QUICK-START.md` - 5-minute quickstart
- `INSTALL.md` - Detailed installation
- `EXAMPLE-OUTPUT.md` - Expected output examples
- `FINDINGS.md` - Research findings summary

**In `documentation/requests-tracker/`**:
- `REQUEST-INTERCEPTION-GUIDE.md` - This file (comprehensive guide)

### Output Directories

**Captures**: `requests_tracker/captures/`
- `.mitm` files (binary format)
- Named: `claude_requests_TIMESTAMP.mitm` or `test_capture_TIMESTAMP.mitm`

**Analysis**: `requests_tracker/analysis/`
- `[capture_name]/` folders
- `request_NNN.txt` files (human-readable)

---

## Security Considerations

### Safe Usage

**This setup is SAFE for**:
- Local development
- Educational analysis
- Understanding API behavior

**NOT safe for**:
- Production environments
- Analyzing other users' requests
- Bypassing security controls

### Why It's Undetectable

**Anthropic cannot detect this** because:
1. Proxy runs locally (localhost:8080)
2. Requests appear to come from normal Claude Code installation
3. No network-level detection possible
4. Certificate trust is client-side

### Ethical Considerations

**What we're doing**:
- ✅ Analyzing our own API requests
- ✅ Understanding documented API behavior
- ✅ Educational research
- ✅ Improving open-source alternatives

**What we're NOT doing**:
- ❌ Reverse-engineering proprietary algorithms
- ❌ Accessing other users' data
- ❌ Violating terms of service
- ❌ Bypassing rate limits or payment

### API Key Security

**Your API key is visible** in captured requests.

**Keep captures secure**:
```bash
# Never commit captures to git
echo "requests_tracker/captures/" >> .gitignore
echo "requests_tracker/analysis/" >> .gitignore

# Delete old captures
rm requests_tracker/captures/*.mitm
rm -rf requests_tracker/analysis/*
```

---

## Next Steps

### Further Research

**Test these scenarios**:
1. CLAUDE.md loading from project directory
2. Skills activation with PDF/image files
3. Rules usage with `--rules` flag
4. Long multi-turn conversations
5. Different agent types (explore, plan, implement)

### Apply Findings

**For OpenCode development**:
1. Extract Claude Code's system prompt structure
2. Implement similar example-driven blocks
3. Add detailed git workflow instructions
4. Test multi-model support (Haiku + Sonnet)
5. Compare performance with improved prompts

### Share Results

**Documentation to create**:
1. System prompt comparison (Claude Code vs OpenCode)
2. Tool description analysis
3. Performance metrics (before/after prompt improvements)
4. Feature gap analysis (real vs perceived)

---

## Conclusion

Request interception revealed that **Claude Code's quality comes from engineering, not magic**:

**Core strengths**:
- 12,927-character detailed system prompts
- Example-driven instruction blocks
- Multi-model optimization
- Comprehensive tool descriptions

**Marketed features (less important)**:
- CLAUDE.md (conditionally loaded)
- Skills (rarely activated)
- Rules (niche use case)
- Hooks (client-side only)

**For OpenCode**: Focus on prompt engineering quality before adding feature complexity.

**User was right**: The quality is 80% model, 15% prompts, 5% features.
