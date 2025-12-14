# Quick Commands Reference

**Copy-paste commands for testing**

---

## Setup Check

```powershell
# Verify certificate
certutil -user -verifystore Root mitmproxy

# Test capture
cd C:\Users\canya\Documents\projects\nori\requests_tracker\scripts
.\test-capture.ps1
```

---

## Single Command Capture

```powershell
cd C:\Users\canya\Documents\projects\nori\requests_tracker\scripts
.\capture-with-node-cert.ps1
```

---

## Multi-Command Capture

**Terminal 1 (start mitmproxy)**:
```powershell
cd C:\Users\canya\Documents\projects\nori\requests_tracker\scripts
.\quick-start.ps1
```

**Terminal 2 (run commands)**:
```powershell
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "your command here"
# Press 'q' in Terminal 1 when done
```

---

## Analysis

```powershell
cd C:\Users\canya\Documents\projects\nori\requests_tracker
python scripts\analyze-capture.py captures\[filename].mitm
```

---

## Search Commands

```bash
# Find CLAUDE.md content
grep -i "claude.md\|professional objectivity" analysis\*/request_*.txt

# Find skills
grep -A 10 "available_skills" analysis\*/request_*.txt

# Count tokens
wc -w analysis\*/request_008.txt

# System prompt
grep -A 100 "MAIN SYSTEM PROMPT" analysis\*/request_008.txt

# Cache info
grep "cache_control" analysis\*/request_*.txt
```

---

## Test Project Setup

```powershell
# Create test directory
mkdir C:\temp\claude-test
cd C:\temp\claude-test

# Create CLAUDE.md
@"
# Test Project

## Rules
1. Use TypeScript
2. Write tests first

## Architecture
- React frontend
- Node.js backend
"@ | Out-File -Encoding UTF8 CLAUDE.md

# Create test skill
mkdir -p .claude\skills\test-skill
@"
{
  "name": "test-skill",
  "description": "Test skill",
  "instructions": "Detailed test instructions"
}
"@ | Out-File -Encoding UTF8 .claude\skills\test-skill\skill.json
```

---

## Test Sequences

**CLAUDE.md test**:
```powershell
cd C:\temp\claude-test
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "what's in this project?"
```

**Skills test**:
```powershell
cd C:\temp\claude-test
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "use test-skill"
```

**Conversation test**:
```powershell
cd C:\temp\claude-test
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'

claude -p "hello"
claude -p "what is 2+2?"
claude -p "what is 3+3?"
claude -p "summarize our conversation"
```

---

## File Locations

**Captures**: `requests_tracker/captures/*.mitm`
**Analysis**: `requests_tracker/analysis/*/request_*.txt`
**Scripts**: `requests_tracker/scripts/`
**Docs**: `documentation/requests-tracker/`

---

## Troubleshooting

**Empty capture**:
```powershell
.\test-capture.ps1
# Should show ✅ and 7.6KB
```

**Port in use**:
```powershell
netstat -ano | findstr :8080
taskkill /F /PID [PID]
```

**Certificate check**:
```powershell
certutil -user -verifystore Root mitmproxy
# Should show certificate details
```

---

## Quick Analysis Checks

```powershell
cd C:\Users\canya\Documents\projects\nori\requests_tracker

# Latest capture
$latest = (Get-ChildItem captures\*.mitm | Sort-Object LastWriteTime -Descending)[0]
python scripts\analyze-capture.py $latest.FullName

# List all requests
ls analysis\*\request_*.txt

# Token count comparison
Get-ChildItem analysis\*\request_*.txt | ForEach-Object {
    "$($_.Name): $((Get-Content $_ | Measure-Object -Word).Words) tokens"
}
```
