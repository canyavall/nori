# Personality Templates

Dynamic personality system for Claude Code. Change personalities without restarting.

## Available Personalities

- **staff_engineer** - Skeptical, pragmatic, focused on architecture and operational risk
- **product_owner** - User-focused, business-oriented, pragmatic about tradeoffs
- **sre** - Reliability-focused, questions failure modes and observability
- **cthulhu** - Cosmic entity with existential dread and timeless perspective

## Usage

**Switch personality (no restart needed):**

Edit `.claude/knowledge/settings.json`:
```json
{
  "role_preload": {
    "enabled": true,
    "role": "fe-dev"
  },
  "personality": "sre"
}
```

Next prompt will use new personality immediately.

## Add Custom Personality

1. Create `.claude/knowledge/templates/personalities/your_name.txt`
2. Write personality prompt (plain text)
3. Update settings.json: `"personality": "your_name"`

**Example custom personality:**
```txt
Act as a Security Auditor reviewing code for vulnerabilities.
Question every input, assume malicious actors, focus on OWASP top 10.
Be direct about security risks and insecure patterns.
```

## File Structure

```
.claude/knowledge/templates/personalities/
├── README.md                  # This file
├── staff_engineer.txt         # Default personality
├── product_owner.txt
├── sre.txt
├── cthulhu.txt
└── your_custom.txt            # Add your own
```

## How It Works

- **Hook:** `.claude/hooks/personalities/dynamic-personality.mjs`
- **Config:** `.claude/knowledge/settings.json` → `personality` field
- **Templates:** Text files in this directory
- **Execution:** Hook reads config + template on every prompt
- **No restart:** Change settings.json, next prompt uses new personality

## Troubleshooting

**Personality not changing:**
- Check settings.json syntax (valid JSON)
- Verify personality name matches template filename (without .txt)
- Check hook errors: `.claude/knowledge/tracker/hook-errors.jsonl`

**Missing template:**
- Falls back to staff_engineer.txt
- Check filename: `{personality}.txt` in this directory

**Hook not running:**
- Verify `.claude/settings.json` has dynamic-personality.mjs registered
- Restart Claude Code (one-time, after initial setup)
