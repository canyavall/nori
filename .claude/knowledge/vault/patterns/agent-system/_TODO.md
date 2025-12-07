# Agent System Knowledge TODO

Based on detected tech stack and repository analysis, consider creating knowledge packages for:

## Agent Architecture
- [ ] Agent definition patterns (YAML frontmatter + system prompt structure)
- [ ] Agent selection algorithm (when to use general-purpose vs code vs build vs plan agents)
- [ ] Sub-agent spawning patterns (parallel work coordination)
- [ ] Agent communication protocols (context passing, result aggregation)

## Agent Implementation
- [ ] Custom agent creation (template, best practices)
- [ ] Agent tool restrictions (per-agent permissions)
- [ ] Agent lifecycle management (initialization, execution, cleanup)
- [ ] Agent error handling patterns

## Prompt Engineering
- [ ] System prompt construction (from session/system.ts)
- [ ] Context injection strategies
- [ ] Tool prompt patterns (from tool/*.txt files)
- [ ] Structured output patterns

## Comparison Insights (from agents-comparison.md)
- [ ] OpenCode vs Claude Code agent differences
- [ ] Agent confidence and task complexity mapping
- [ ] Deploy agent patterns (Claude Code specific)
- [ ] Multi-agent workflows

## Reference Files
- `base_repositories/opencode-fork/packages/opencode/src/agent/agent.ts`
- `base_repositories/opencode-fork/packages/opencode/src/session/processor.ts`
- `agents-comparison.md` (50+ pages)

## To create knowledge:
```bash
/knowledge-create patterns/agent-system <topic-name>
```

Example:
```bash
/knowledge-create patterns/agent-system agent-selection-algorithm
```
