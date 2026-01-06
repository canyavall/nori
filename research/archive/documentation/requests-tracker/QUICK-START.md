# Quick Start Guide - 5 Minutes to First Capture

## Step 1: Install Certificate (First Time Only - 2 minutes)

```bash
# Start mitmproxy
python -m mitmproxy
```

1. Open browser → Go to **http://mitm.it**
2. Click your OS (Windows/macOS/Linux)
3. Download certificate
4. Install certificate:
   - **Windows**: Double-click → Install → "Trusted Root Certification Authorities"
   - **macOS**: Double-click → Keychain Access → Trust
   - **Linux**: Copy to `/usr/local/share/ca-certificates/` → `update-ca-certificates`
5. Close mitmproxy (Ctrl+C)

## Step 2: Capture Request (2 minutes)

**Terminal 1**:
```bash
cd requests_tracker
python scripts/start-capture.py
```

**Terminal 2**:
```powershell
# PowerShell (Windows)
$env:HTTPS_PROXY='http://localhost:8080'
claude -p "Say hello"

# Git Bash / Linux / macOS
HTTPS_PROXY=http://localhost:8080 claude -p "Say hello"
```

**Terminal 1**: Press `q` to stop

## Step 3: Analyze (1 minute)

```bash
python scripts/analyze-capture.py captures/claude_requests_*.mitm
```

Look in `analysis/claude_requests_TIMESTAMP/request_001.txt` - you'll see:
- ⭐ MAIN SYSTEM PROMPT
- 📄 CLAUDE.MD CONTENT (if loaded)
- 🎯 SKILL DEFINITION (if activated)
- 📋 RULES CONTENT (if present)

## Done!

You now have the exact prompts Claude Code sends to the API.

## What to Look For

1. **CLAUDE.md**: Search file for "📄 CLAUDE.MD CONTENT"
2. **Skills**: Search for "🎯 SKILL DEFINITION"
3. **System Prompt**: Look for "⭐ MAIN SYSTEM PROMPT"
4. **Rules**: Look for "📋 RULES CONTENT"

## Next Test: Verify CLAUDE.md

```bash
# Create obvious test
echo "ALWAYS START WITH: CLAUDE_MD_TEST" > CLAUDE.md

# Capture
HTTPS_PROXY=http://localhost:8080 claude -p "Hello"

# Check analysis - should see "CLAUDE_MD_TEST" in system prompt!
```

If you don't see it → CLAUDE.md isn't being loaded properly.
