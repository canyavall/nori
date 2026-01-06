---
tags:
  - analysis
  - research
  - request-interception
  - api-debugging
  - mitm
  - system-prompts
description: >-
  Intercept Claude Code API requests to analyze system prompts, tool usage, and quality
  differences: mitmproxy setup, capture workflow, analysis checklist, and key findings
  about prompt engineering patterns
category: nori/research
required_knowledge: []
---
# Claude Code Request Interception

Intercept Claude Code API requests to understand system prompts, tool usage, and quality differences vs OpenCode.

## Quick Setup

```powershell
# Install certificate (one-time)
cd requests_tracker/scripts
.\install-certificate.ps1

# Test it works
.\test-capture.ps1  # Should show ✅ 7.6KB captured
```

**Critical**: Certificate must go to "Trusted Root Certification Authorities" (NOT "Personal").

## Capture Workflow

```powershell
# Automated (recommended)
cd requests_tracker/scripts
.\capture-with-node-cert.ps1

# Manual (for long conversations)
# Terminal 1
.\quick-start.ps1

# Terminal 2
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "your prompt"
# Press 'q' in Terminal 1 to save

# Analyze
cd ..
python scripts\analyze-capture.py captures\claude_*.mitm
```

## Analysis Checklist

**Location**: `analysis/[capture_name]/request_NNN.txt`

```bash
# 1. System prompt length (should be ~750 lines for Claude Code)
grep -A 100 "MAIN SYSTEM PROMPT" analysis/*/request_008.txt | wc -l

# 2. Check CLAUDE.md loading
grep -i "claudeMd\|project instructions" analysis/*/request_008.txt

# 3. Check skills activation
grep -A 10 "available_skills" analysis/*/request_008.txt

# 4. Model usage
grep "Model:" analysis/*/request_*.txt

# 5. Tool descriptions
grep -A 20 '"name": "Bash"' analysis/*/request_008.txt
```

## Key Findings (Our Project)

**Claude Code quality**: 80% Model + 15% System prompt (12,927 chars) + 5% Tools

**NOT from**: CLAUDE.md (conditional), Skills (usually empty), Rules (niche)

**What to replicate in OpenCode**:
1. Expand system prompt to ~12,000 chars
2. Add example-driven blocks (`<example>...</example>`)
3. Include detailed git workflow (57 lines in Claude Code)
4. Add multi-model support (Sonnet + Haiku)

## Testing & Troubleshooting

**Test CLAUDE.md loading**:
```powershell
cd C:\path\to\nori && $env:HTTPS_PROXY='http://localhost:8080' && $env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "what's in this project?" # Check: grep -i "claudeMd" analysis/*/request_*.txt
```

**Test skills**: `claude -p "analyze PDF: file.pdf"` then check `available_skills` in analysis

**Compare OpenCode**: Same capture workflow, diff `analysis/claude_*/request_008.txt` vs `analysis/opencode_*/request_008.txt`

**Common fixes**:
- Empty capture → Certificate in "Trusted Root" not "Personal", restart terminal
- Claude hangs → Set both `HTTPS_PROXY` and `NODE_TLS_REJECT_UNAUTHORIZED=0`
- Analyzer fails → Already fixed in script (UTF-8 encoding)

## Scripts Reference

**Location**: `requests_tracker/scripts/`

- `capture-with-node-cert.ps1` - Automated single capture
- `quick-start.ps1` - Interactive capture
- `test-capture.ps1` - Verify setup
- `analyze-capture.py` - Parse captures

**Full docs**: `documentation/requests-tracker/REQUEST-INTERCEPTION-GUIDE.md`
