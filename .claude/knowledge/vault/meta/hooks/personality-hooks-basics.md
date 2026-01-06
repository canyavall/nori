---
tags:
  - hooks
  - personality
  - configuration
description: Personality hook system basics and configuration
category: meta/hooks
required_knowledge: []
---
# Personality Hooks

Hooks that modify Claude's communication style.

## What Are Personality Hooks?

Hooks that append personality instructions to user prompts.

**How they work:**
1. User submits prompt
2. Hook intercepts and appends personality instruction
3. Claude receives: prompt + instruction
4. Claude responds with modified style

## Active Personality: honest-critical

**File:** `.claude/knowledge/hooks/personalities/honest-critical.mjs`

**Effect:** Enforces direct, honest communication:
- Point out problems without sugar-coating
- Challenge bad assumptions
- Push back on unnecessary complexity
- Prioritize accuracy over validation

**Enable:**
```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "node .claude/knowledge/hooks/personalities/honest-critical.mjs"
      }]
    }]
  }
}
```

**Disable:** Remove from settings.json.

## Creating New Personalities

**Template:** `.claude/knowledge/hooks/personalities/[name].mjs`

```javascript
#!/usr/bin/env node
const stdin = require('fs').readFileSync(0, 'utf-8');
let prompt = stdin;
try { prompt = JSON.parse(stdin).prompt || stdin; } catch {}
console.log(`${prompt}\n\nYour personality instruction here`);
process.exit(0);
```

**Make executable:** `chmod +x .claude/knowledge/hooks/personalities/[name].mjs`

## Personality Ideas

- **concise**: "Be extremely concise, use < 50 words per response"
- **verbose**: "Provide detailed explanations with examples"
- **fun**: "Use friendly, casual language with occasional humor"
- **formal**: "Use professional, technical language"
- **socratic**: "Guide through questions rather than direct answers"

## Multiple Personalities

**Problem:** Can only have one active at a time.

**Workaround:** Comment/uncomment in settings.json or create merged personality.

## Testing

```bash
echo '{"prompt": "test"}' | node .claude/knowledge/hooks/personalities/honest-critical.mjs
# Should output: test\n\nBe honest and critical
```

## Best Practices

1. **Keep instructions brief** - Long instructions consume tokens
2. **Be specific** - "Be concise" vs "Keep responses under 50 words"
3. **Test thoroughly** - Verify personality applies consistently
4. **One active** - Multiple personalities conflict
5. **Hook order** - Personality should run after knowledge hook

## Integration

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [
        {"command": "node .claude/knowledge/hooks/knowledge-prompt.mjs"},
        {"command": "node .claude/knowledge/hooks/personalities/honest-critical.mjs"}
      ]
    }]
  }
}
```

**Order matters:** Knowledge → Personality
