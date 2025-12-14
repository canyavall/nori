# Claude Code Testing Checklist

**Track your testing progress**

---

## Quick Setup Verification

- [x] mitmproxy installed
- [x] Certificate installed (Trusted Root)
- [x] Test capture successful (7.6KB)
- [x] Analysis script working
- [x] Baseline capture completed

---

## Test 1: Baseline Control

- [x] Test 1.1: Minimal request ("Say hello")
  - File: `captures/claude_20251213_231802.mitm`
  - Result: 10 requests, 195KB, 12,927 char system prompt
  - Finding: 80% model + 15% prompt + 5% tools

---

## Test 2: CLAUDE.md Loading

- [ ] Test 2.1: Small CLAUDE.md (100 lines)
  - Directory: `C:\temp\claude-test`
  - File created: ✓/✗
  - Capture completed: ✓/✗
  - CLAUDE.md appears in request: ✓/✗
  - Location: _____________
  - Full content or summary: _____________

- [ ] Test 2.2: From nori directory (our 5KB CLAUDE.md)
  - Capture completed: ✓/✗
  - CLAUDE.md appears: ✓/✗
  - Content includes "Serena MCP": ✓/✗
  - Token count: _____________

- [ ] Test 2.3: Large CLAUDE.md (500 lines)
  - Capture completed: ✓/✗
  - Full content sent: ✓/✗
  - Truncated: ✓/✗
  - Token count: _____________

---

## Test 3: Skills

- [ ] Test 3.1: Create test skill
  - Skill created at `.claude/skills/test-skill`: ✓/✗
  - skill.json valid: ✓/✗

- [ ] Test 3.2: Skills activation
  - Capture with skill trigger: ✓/✗
  - Skill appears in `<available_skills>`: ✓/✗
  - Full instructions or reference: _____________

- [ ] Test 3.3: Skills without trigger
  - Capture without trigger: ✓/✗
  - Skills section empty: ✓/✗

---

## Test 4: Conversation Growth

- [ ] Test 4.1: Multi-turn conversation
  - 6 commands captured: ✓/✗
  - File: `captures/conversation_*.mitm`

- [ ] Test 4.2: Token count per request
  - Request 1: _____ tokens
  - Request 2: _____ tokens (+_____)
  - Request 3: _____ tokens (+_____)
  - Request 4: _____ tokens (+_____)
  - Request 5: _____ tokens (+_____)
  - Request 6: _____ tokens (+_____)

- [ ] Test 4.3: Summarization detection
  - Growth plateaus at request #: _____
  - Previous content summarized: ✓/✗
  - Summary location: _____________

---

## Test 5: Rules (Optional)

- [ ] Test 5.1: Basic rules (3 files)
  - Rules file created: ✓/✗
  - Capture with --rules: ✓/✗
  - File content in request: ✓/✗

- [ ] Test 5.2: Maximum rules (20 files)
  - Capture completed: ✓/✗
  - All files sent: ✓/✗
  - Token count: _____________

---

## Test 6: Hooks (Optional)

- [ ] Test 6.1: Create test hooks
  - user-prompt-submit hook: ✓/✗
  - Hooks fire (check terminal): ✓/✗
  - Hooks in API request: ✓/✗

---

## Test 7: Caching Analysis

- [ ] Test 7.1: Cache control types
  - System prompt cache type: _____________
  - CLAUDE.md cache type: _____________
  - Tools cache type: _____________

- [ ] Test 7.2: Cache reuse across requests
  - Same system prompt in all requests: ✓/✗
  - Cache headers present: ✓/✗

---

## Findings Summary

**CLAUDE.md**:
- Loads: ✓/✗
- Location: _____________
- Full/Summary: _____________
- Impact: High/Medium/Low

**Skills**:
- Loads: ✓/✗
- When: _____________
- Impact: High/Medium/Low

**Conversation**:
- Grows by: _____ tokens/request
- Summarizes after: _____ requests
- Impact: High/Medium/Low

**Most valuable feature**: _____________

**Least valuable feature**: _____________

**Recommended for wrapper**: _____________

---

## Time Tracking

- Setup verification: _____ min
- CLAUDE.md tests: _____ min
- Skills tests: _____ min
- Conversation tests: _____ min
- Analysis time: _____ min
- **Total**: _____ min

---

## Next Steps

After completing tests:
- [ ] Write FINDINGS-DAY2.md
- [ ] Update REQUEST-INTERCEPTION-GUIDE.md with findings
- [ ] Decide wrapper implementation priorities
- [ ] Plan Phase 2 testing (if needed)
