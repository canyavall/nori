# Hooks Troubleshooting - Common Issues

Common hook problems and quick fixes.

## Hook Not Running

**Diagnosis:**
```bash
cat .claude/settings.json | grep -A 10 "hooks"
ls -l .claude/knowledge/hooks/*.mjs
```

**Solutions:**
1. Add hook to settings.json (see hooks-system.md for format)
2. Check file exists: `ls .claude/knowledge/hooks/knowledge-prompt.mjs`
3. Validate JSON: `cat .claude/settings.json | jq .`
4. Restart Claude Code

## Session State Issues

**Problem:** Always seeing abbreviated prompt.

**Fix:**
```bash
rm .claude/knowledge/tracker/knowledge-session-state.jsonl
```

**State corruption:** Hook auto-recovers. Manual: delete state file above.

## Personality Hook Issues

**Problem:** Claude not showing expected style.

**Test:**
```bash
echo '{"prompt": "test"}' | node .claude/knowledge/hooks/personalities/honest-critical.mjs
```

**Fix:** Add to settings.json (see personality-hooks.md for examples).

**Order:** Knowledge hook before personality hook.

## Hook Execution Order

**Rule:** Hooks execute in settings.json array order.

**Test:** Watch terminal output during hook execution.
