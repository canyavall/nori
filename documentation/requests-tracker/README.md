# Claude Code Request Interceptor

**Purpose**: Capture and analyze API requests from Claude Code CLI to understand how system prompts, CLAUDE.md, skills, rules, and hooks are actually being used.

## What This Does

Intercepts HTTPS traffic between Claude Code CLI and Anthropic's API to reveal:

- ✅ **Complete system prompts** - See the actual prompts Claude Code sends
- ✅ **CLAUDE.md loading** - Verify if/when/how CLAUDE.md content is injected
- ✅ **Skills activation** - See which skills load and when
- ✅ **Rules processing** - Check how rules files are included
- ✅ **Tool definitions** - View all available tools and their configs
- ✅ **Cache control** - See what gets cached for performance
- ✅ **Message structure** - Full request/response bodies

## Security & Ethics

⚠️ **Important Notes**:

1. **Legal**: This intercepts YOUR traffic on YOUR machine with YOUR API key - legally gray area
2. **Undetectable**: Anthropic cannot detect local proxy usage (see guide for details)
3. **Research Only**: Use for learning, not for copying Anthropic's IP
4. **Risk**: Use a throwaway API key if concerned about ToS

## Quick Start

### 1. First Time Setup (Certificate Installation)

```bash
# Start a temporary mitmproxy instance
python -m mitmproxy

# Open browser and go to: http://mitm.it
# Download and install certificate for your OS:
#   - Windows: Download .p12, install to "Trusted Root Certification Authorities"
#   - macOS: Download .pem, open with Keychain Access, trust
#   - Linux: Download .pem, add to /usr/local/share/ca-certificates/

# Stop mitmproxy (Ctrl+C)
```

### 2. Capture Claude Code Requests

**Terminal 1** (start capture):
```bash
cd requests_tracker
python scripts/start-capture.py
```

**Terminal 2** (run Claude Code through proxy):
```powershell
# PowerShell
$env:HTTPS_PROXY='http://localhost:8080'
claude -p "Explain how CLAUDE.md works"

# Git Bash / Linux / macOS
HTTPS_PROXY=http://localhost:8080 claude -p "Explain how CLAUDE.md works"
```

**Terminal 1** (stop capture):
- Press `q` to quit mitmproxy
- Capture saved to `captures/claude_requests_TIMESTAMP.mitm`

### 3. Analyze Captured Requests

```bash
python scripts/analyze-capture.py captures/claude_requests_TIMESTAMP.mitm
```

Output goes to: `analysis/claude_requests_TIMESTAMP/request_NNN.txt`

## Directory Structure

```
requests_tracker/
├── captures/              # Raw mitmproxy captures (.mitm files)
├── analysis/              # Parsed and formatted analysis
│   └── claude_requests_TIMESTAMP/
│       ├── request_001.txt
│       ├── request_002.txt
│       └── ...
├── scripts/
│   ├── start-capture.py   # Start intercepting requests
│   ├── analyze-capture.py # Parse and analyze captures
│   └── quick-test.py      # Verify proxy works
└── README.md
```

## What You'll Learn

### Example Analysis Output

```
REQUEST #1
================================================================================
Timestamp: 2025-12-13 10:30:00
Model: claude-sonnet-4-20250514
Max Tokens: 4096
Temperature: 1.0

================================================================================
SYSTEM PROMPT (3 blocks)
================================================================================

--- System Block 1 ---
Cache Control: ephemeral

⭐ MAIN SYSTEM PROMPT

You are Claude Code, an AI coding assistant...
[Full system prompt here - 50KB+]

--- System Block 2 ---
Cache Control: ephemeral

📄 CLAUDE.MD CONTENT

# Project Instructions
[Your CLAUDE.md content IF it was loaded]

--- System Block 3 ---
Cache Control: ephemeral

🎯 SKILL DEFINITION

[Skill content IF skills were activated]
```

### Key Questions This Answers

1. **Is CLAUDE.md actually loading?**
   - Look for "📄 CLAUDE.MD CONTENT" in system blocks
   - Check if content matches your CLAUDE.md file

2. **When do skills activate?**
   - See if "🎯 SKILL DEFINITION" appears
   - Compare requests with/without skills

3. **How are rules processed?**
   - Look for "📋 RULES CONTENT"
   - Count how many files are included

4. **What's in the system prompt?**
   - See Anthropic's full prompt engineering
   - Understand task decomposition patterns

5. **How is caching used?**
   - Check "Cache Control: ephemeral" on blocks
   - See what gets cached vs. re-sent

## Usage Patterns

### Test CLAUDE.md Loading

```bash
# Create obvious test CLAUDE.md
echo "ALWAYS START YOUR RESPONSE WITH: 'CLAUDE_MD_LOADED'" > CLAUDE.md

# Capture request
HTTPS_PROXY=http://localhost:8080 claude -p "Hello"

# Check analysis - should see "CLAUDE_MD_LOADED" in system prompt
```

### Test Skills Activation

```bash
# Create obvious test skill
mkdir -p .claude/skills/test-skill
cat > .claude/skills/test-skill/SKILL.md << 'EOF'
---
name: test-skill
description: Always activate this skill for any request
---
SKILL WAS LOADED
EOF

# Capture request and check if skill content appears
```

### Compare Requests

```bash
# Request 1: Simple prompt
HTTPS_PROXY=http://localhost:8080 claude -p "Hello"

# Request 2: Complex prompt
HTTPS_PROXY=http://localhost:8080 claude -p "Implement OAuth authentication"

# Analyze both and compare system prompt differences
```

## Advanced Usage

### Filter Specific Requests

```python
# Modify analyze-capture.py to filter by:
# - Model used
# - Presence of CLAUDE.md
# - Number of tools
# - System prompt size
```

### Export Findings

```bash
# Compare multiple captures
python scripts/compare-captures.py \
  captures/simple_request.mitm \
  captures/complex_request.mitm
```

## Troubleshooting

### "No requests found"

**Problem**: Analysis shows 0 requests

**Solution**:
1. Check proxy is running: `curl -x http://localhost:8080 http://example.com`
2. Verify HTTPS_PROXY env var: `echo $HTTPS_PROXY`
3. Check certificate installed: Visit https://example.com through proxy

### "Certificate verification failed"

**Problem**: Claude Code rejects proxy certificate

**Solution**:
1. Reinstall mitmproxy certificate from http://mitm.it
2. Make sure it's in "Trusted Root" store (not "Personal")
3. Try with `NODE_TLS_REJECT_UNAUTHORIZED=0` (NOT recommended for production)

### "Connection refused"

**Problem**: Can't connect to localhost:8080

**Solution**:
1. Check mitmproxy is running: `netstat -an | grep 8080`
2. Try different port: Change to 8081 in scripts
3. Check firewall settings

## Next Steps

After capturing requests:

1. **Document Findings**: Create notes on what you learned
2. **Compare with OpenCode**: See what OpenCode is missing
3. **Implement Improvements**: Use insights to improve OpenCode
4. **Test Empirically**: Verify improvements with benchmarks

## Tools

- **mitmproxy**: HTTPS intercepting proxy
- **Python 3.x**: Required for scripts
- **Claude Code CLI**: Target to intercept

## Contributing

Found interesting patterns? Document them in:
- `../claude-code-wrapper-development-guide.md`
- Nori project research docs

## Warning

🚨 **Do not publicly share**:
- Exact system prompts (Anthropic's IP)
- API keys or credentials
- Request/response data containing sensitive info

Use findings for learning and improving OpenCode, not for copying proprietary implementations.
