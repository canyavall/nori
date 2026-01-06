# Quick Start for Tomorrow - Claude Code Testing

**Goal**: Understand what Claude Code features actually do through API interception

---

## What We Have Ready

✅ **mitmproxy installed and working**
- Location: `requests_tracker/`
- Certificate installed
- Test passed (7.6KB capture)

✅ **One baseline capture completed**
- File: `captures/claude_20251213_231802.mitm`
- Analyzed: 10 requests, 195KB
- Finding: 80% model + 15% prompt (12,927 chars) + 5% tools

✅ **Key discovery**: CLAUDE.md, skills, rules NOT the main quality drivers

---

## Tomorrow's Mission: Test Features Empirically

**Time needed**: ~4 hours for core tests

### Quick Test Sequence (Do These in Order)

#### 1. Baseline Control (30 min)
**Already done - skip unless you want to verify**

#### 2. CLAUDE.md Test (1 hour)

**Test 2A - Small CLAUDE.md (30 min)**:
```powershell
# Create test project
mkdir C:\temp\claude-test
cd C:\temp\claude-test

# Create CLAUDE.md
@"
# Test Project

## Rules
1. Always use TypeScript
2. Write tests first
3. Follow REST conventions

## Architecture
- Frontend: React
- Backend: Node.js

## Coding Standards
- Use async/await
- Error handling required
- Document all functions
"@ | Out-File -Encoding UTF8 CLAUDE.md

# Capture
cd C:\Users\canya\Documents\projects\nori\requests_tracker\scripts
.\capture-with-node-cert.ps1
# When prompted, it will run: claude -p "Say hello in one word"

# Modify to test from test directory instead
# OR manually run:
cd C:\temp\claude-test
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "what's in this project?"
```

**Check results**:
```bash
cd C:\Users\canya\Documents\projects\nori\requests_tracker
python scripts\analyze-capture.py captures\claude_*.mitm
grep -i "CLAUDE.md\|Test Project\|Rules" analysis\*/request_*.txt
```

**Questions to answer**:
- Is CLAUDE.md content in the request? ✓/✗
- Where in the request? (system prompt, separate block, user message)
- Full content or summarized?

**Test 2B - From nori directory (30 min)**:
```powershell
# Test with our actual CLAUDE.md
cd C:\Users\canya\Documents\projects\nori
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "what's in this project?"

# Check
grep -i "CLAUDE.md\|Professional Objectivity\|Serena MCP" analysis\*/request_*.txt
```

**Expected**: Our 5KB CLAUDE.md should appear somewhere

#### 3. Skills Test (1 hour)

**Create test skill**:
```powershell
cd C:\temp\claude-test
mkdir -p .claude\skills\test-skill

# Create skill.json
@"
{
  "name": "test-skill",
  "description": "Test skill for interception analysis",
  "instructions": "This is a test skill with detailed instructions to see how skills are loaded"
}
"@ | Out-File -Encoding UTF8 .claude\skills\test-skill\skill.json

# Test with trigger
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "use test-skill to analyze something"
```

**Check**:
```bash
grep -A 20 "available_skills" analysis\*/request_*.txt
grep -i "test-skill" analysis\*/request_*.txt
```

**Questions**:
- Does skill appear in `<available_skills>`? ✓/✗
- Full content or just name?
- When does it activate?

#### 4. Conversation Growth Test (1.5 hours)

**Measure context accumulation**:
```powershell
# Start mitmproxy manually for continuous capture
cd C:\Users\canya\Documents\projects\nori\requests_tracker\scripts
.\quick-start.ps1

# In NEW PowerShell window
cd C:\temp\claude-test
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'

# Run sequence
claude -p "hello"
claude -p "what is 2+2?"
claude -p "what is 3+3?"
claude -p "what is 4+4?"
claude -p "what is 5+5?"
claude -p "summarize our conversation"

# Stop mitmproxy (press 'q' in first window)
```

**Analyze**:
```bash
python scripts\analyze-capture.py captures\claude_requests_*.mitm

# Count requests
ls analysis\*/request_*.txt

# Check token growth
for i in {1..6}; do
  echo "Request $i:"
  wc -w analysis\*/request_00$i.txt
done
```

**Questions**:
- How much does context grow per request?
- When does summarization kick in?
- Is previous conversation in later requests?

---

## Quick Commands Reference

**Start capture (automated)**:
```powershell
cd C:\Users\canya\Documents\projects\nori\requests_tracker\scripts
.\capture-with-node-cert.ps1
```

**Start capture (manual for multiple commands)**:
```powershell
# Terminal 1
cd C:\Users\canya\Documents\projects\nori\requests_tracker\scripts
.\quick-start.ps1

# Terminal 2
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "your command"
# Run more commands...

# Terminal 1 - press 'q' to stop
```

**Analyze capture**:
```powershell
cd C:\Users\canya\Documents\projects\nori\requests_tracker
python scripts\analyze-capture.py captures\[filename].mitm
```

**Check for specific content**:
```bash
# CLAUDE.md
grep -i "claude.md" analysis\*/request_*.txt

# Skills
grep -A 10 "available_skills" analysis\*/request_*.txt

# System prompt
grep -A 50 "MAIN SYSTEM PROMPT" analysis\*/request_*.txt

# Token count
wc -w analysis\*/request_008.txt
```

---

## What to Look For in Analysis

**In each request_NNN.txt file**:

1. **System Prompt** (lines 20-400):
   - Size: ~12,927 chars for Claude Code
   - Check for CLAUDE.md content
   - Check for skill instructions
   - Check for project-specific content

2. **Tools** (lines 400-700):
   - List of 17 tools
   - Tool descriptions

3. **Skills** (around line 700):
   ```xml
   <available_skills>
   [skills here or empty]
   </available_skills>
   ```

4. **Cache Control**:
   - `"cache_control": {"type": "ephemeral"}` - request-specific
   - Look for what's cached vs fresh

---

## Expected Findings

**CLAUDE.md**:
- ✓ Should appear when running from project directory
- ✓ Likely in system prompt or separate block
- ? Full content or summarized (test to find out)

**Skills**:
- ? Appears in `<available_skills>` when triggered
- ? Full instructions vs reference only (test to find out)

**Conversation**:
- ✓ Context grows with each request
- ? Summarization kicks in at some point (measure when)
- ✓ System prompt stays stable

---

## Tonight's Achievement

✅ Set up complete testing infrastructure
✅ Captured baseline (simple "hello" command)
✅ Found core quality driver: 80% model + 15% detailed prompts
✅ Disproved marketing: CLAUDE.md/skills/rules not main factors
✅ Created comprehensive test plan
✅ Documented everything

---

## Tomorrow's Output

**By end of session, you'll know**:
1. Does CLAUDE.md actually load? ✓/✗
2. Where does it appear in API request?
3. Do skills load? When?
4. How does conversation affect context?
5. What's cached vs sent every time?

**Document findings in**:
`requests_tracker/FINDINGS-DAY2.md`

---

## If Something Breaks

**Certificate issues**:
```powershell
cd C:\Users\canya\Documents\projects\nori\requests_tracker\scripts
.\test-capture.ps1  # Should show ✅
```

**Empty capture (0 bytes)**:
- Check certificate installed to "Trusted Root Certification Authorities"
- Restart PowerShell
- Run test-capture.ps1 again

**Claude Code hangs**:
- Make sure both env vars set:
  - `$env:HTTPS_PROXY='http://localhost:8080'`
  - `$env:NODE_TLS_REJECT_UNAUTHORIZED='0'`
- Check mitmproxy running: `netstat -an | findstr 8080`

---

## Quick Wins

**If you only have 30 minutes**:
1. Run Test 2B (CLAUDE.md from nori directory)
2. Check if it appears in analysis
3. Document yes/no

**If you have 2 hours**:
1. Test 2A + 2B (CLAUDE.md)
2. Test 3 (Skills)
3. Document findings

**If you have 4 hours**:
1. All of above
2. Test 4 (Conversation growth)
3. Write comprehensive findings

---

## Files to Check Tomorrow

**Captures**: `requests_tracker/captures/*.mitm`
**Analysis**: `requests_tracker/analysis/*/request_*.txt`
**Full guide**: `documentation/requests-tracker/REQUEST-INTERCEPTION-GUIDE.md`

---

**Time to test**: ~4 hours
**Expected outcome**: Know exactly what features do
**Value**: Stop guessing, start implementing what actually works

**Ready to start tomorrow morning.**
