# Hooks Troubleshooting - Advanced

Performance, monitoring, testing, and error diagnosis.

## Hook Performance

**Target:** < 100ms execution time

**Check metrics:**
```bash
tail -20 .claude/knowledge/tracker/knowledge-hook-metrics.jsonl | jq 'select(.event == "hook_execution") | .executionTimeMs'
```

**If slow:** Reduce file I/O, optimize knowledge.json search.

## Knowledge Loading Compliance

**Required:** Start response with `"Loaded: [packages]"` or `"No knowledge needed: [reason]"`.

**Check:**
```bash
tail -10 .claude/knowledge/tracker/knowledge-tracking.jsonl | jq .
```

## Testing Hooks

```bash
# Test individual hooks
echo '{"prompt": "test"}' | node .claude/knowledge/hooks/knowledge-prompt.mjs
echo '{"prompt": "test"}' | node .claude/knowledge/hooks/personalities/fun.mjs
node .claude/knowledge/hooks/session-start-cleanup.mjs

# Test hook chain
echo '{"prompt": "test"}' | node .claude/knowledge/hooks/knowledge-prompt.mjs | node .claude/knowledge/hooks/personalities/fun.mjs
```

## Monitoring

```bash
# Hook execution
tail -20 .claude/knowledge/tracker/knowledge-hook-metrics.jsonl | jq 'select(.event == "hook_execution")'

# Token savings
jq 'select(.event == "token_savings")' .claude/knowledge/tracker/knowledge-hook-metrics.jsonl

# Errors
cat .claude/knowledge/tracker/hook-errors.jsonl | jq .
```

## Common Errors

**"SyntaxError: Unexpected token"** - Delete `.claude/knowledge/tracker/knowledge-session-state.jsonl`

**"ENOENT: no such file"** - Verify hook file path in settings.json

**"Command not found: node"** - Use full path `/usr/local/bin/node`

**"Permission denied"** - `chmod +x .claude/knowledge/hooks/*.mjs`

**Hook silently fails** - Ensure `process.exit(0)` on success

## Debug Checklist

1. Check settings.json syntax: `jq .`
2. Verify hook files exist
3. Test hooks manually
4. Check metrics for errors
5. Review `.claude/knowledge/tracker/hook-errors.jsonl`

**Verbose debug:** Add `console.error()` to hook files.
