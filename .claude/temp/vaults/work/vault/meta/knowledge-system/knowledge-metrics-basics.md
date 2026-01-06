# Knowledge Metrics Basics

Track knowledge loading efficiency and usage patterns.

## Metrics Files

`.claude/knowledge/tracker/knowledge-tracking.jsonl` - Per-prompt tracking
`.claude/knowledge/tracker/knowledge-hook-metrics.jsonl` - Hook execution metrics

## Key Metrics

**Knowledge Precision:**
- Formula: `used_packages / read_packages`
- Target: >= 0.7 (70%+ of loaded knowledge used)
- Low precision = loading too much irrelevant knowledge

**Token Savings:**
- First prompt: Full categories (~2k tokens)
- Subsequent: Abbreviated (~100 tokens)
- Savings: ~90% after first prompt

**Search Performance:**
- Target: < 100ms per search
- Tracks: tags used, packages returned, relevance scores

## Tracking Commands

**View recent loads:**
```bash
tail -20 .claude/knowledge/tracker/knowledge-tracking.jsonl | jq .
```

**Calculate avg precision:**
```bash
jq -r '.usage.precision // 0' .claude/knowledge/tracker/knowledge-tracking.jsonl | \
  awk '{ total += $1; count++ } END { print "Avg:", total/count }'
```

**Most loaded packages:**
```bash
jq -r '.knowledge.read[]?' .claude/knowledge/tracker/knowledge-tracking.jsonl | \
  sort | uniq -c | sort -rn | head -20
```

**Token savings over session:**
```bash
jq 'select(.event == "token_savings")' .claude/knowledge/tracker/knowledge-hook-metrics.jsonl
```

## Interpretation

**High precision (>0.8):** Loading right knowledge
**Medium precision (0.5-0.8):** Some unnecessary loading
**Low precision (<0.5):** Too broad tags, refine search

**Token savings >85%:** Session optimization working
**Token savings <85%:** Check hook execution metrics
