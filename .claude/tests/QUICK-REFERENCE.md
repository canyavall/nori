# Claude Code Testing Suite - Quick Reference

**One-page guide to running tests**

---

## Fastest Start (45 minutes)

```bash
# 1. Verify prerequisites
claude --version
mitmweb --version

# 2. Install mitmproxy certificate (one-time)
cd requests_tracker/scripts
.\install-certificate.ps1

# 3. Run smoke tests
# - Read: .claude/tests/features/test-claude-md.md (FM-001)
# - Read: .claude/tests/features/test-hooks.md (FH-002)
# - Read: .claude/tests/api-interception/test-scenarios.md (API-001, API-002)

# 4. Record findings
echo "# Test Results - $(date)" > .claude/tests/results/quick-validation-$(date +%Y-%m-%d).md
```

---

## Test Categories

| Category | File | Tests | Time |
|----------|------|-------|------|
| CLAUDE.md | features/test-claude-md.md | 5 | 1h |
| Skills | features/test-skills.md | 5 | 1h |
| Rules | features/test-rules.md | 5 | 1h |
| Hooks | features/test-hooks.md | 5 | 1h |
| Compaction | features/test-compaction.md | 5 | 1-2h |
| API | api-interception/test-scenarios.md | 7 | 2-3h |
| Reliability | patterns/test-reliability.md | 5 (85 runs) | 4-5h |

**Total**: 32+ tests, 6-15 hours

---

## Common Commands

### Capture API Request
```powershell
cd requests_tracker/scripts
.\capture-with-node-cert.ps1
```

### Analyze Capture
```powershell
cd requests_tracker
python scripts\analyze-capture.py captures/[filename].mitm
```

### Search Capture
```bash
# System prompt
grep -A 100 "system" analysis/*/request_001.txt

# CLAUDE.md marker
grep -i "marker-text" analysis/*/request_001.txt

# Tools
grep '"tools"' analysis/*/request_001.txt

# Model
grep '"model"' analysis/*/request_001.txt
```

---

## Reliability Scores

- **ALWAYS** (100%): Production-ready
- **USUALLY** (75-99%): Generally safe
- **SOMETIMES** (25-74%): Use with caution
- **RARELY** (1-24%): Don't rely on
- **NEVER** (0%): Doesn't work

---

## Result Files

```
.claude/tests/results/
├── feature-results-YYYY-MM-DD.md
├── api-results-YYYY-MM-DD.md
├── reliability-results-YYYY-MM-DD.md
└── aggregate-findings-YYYY-MM-DD.md
```

---

## Troubleshooting

**Empty capture?**
→ Reinstall certificate: `.\install-certificate.ps1`
→ Restart terminal
→ Check: `$env:HTTPS_PROXY='http://localhost:8080'`

**Hook not firing?**
→ Check: `.claude/settings.json` hooks section
→ Verify: `ls .claude/knowledge/hooks/knowledge-prompt.mjs`

**CLAUDE.md not loading?**
→ Check location: `.claude/CLAUDE.md` or root `CLAUDE.md`
→ Verify via API: `grep -i "marker" analysis/*/request_001.txt`

---

## Key Test IDs

**Most important tests**:
- FM-001: CLAUDE.md loads?
- FH-002: Hook transforms?
- API-001: Baseline API structure
- API-002: CLAUDE.md in API?
- PR-001: CLAUDE.md reliability

**Run these 5 first** to understand core behavior.

---

**Full guide**: `.claude/tests/run-all-tests.md`
**Overview**: `.claude/tests/README.md`
**Summary**: `.claude/tests/SUMMARY.md`
