# Tool Development Knowledge TODO

Based on detected tech stack (Zod, TypeScript, AI SDK), consider creating:

## Tool Creation Patterns
- [ ] Tool definition structure (name, description, parameters, execute)
- [ ] Zod schema patterns (parameter validation, descriptions for LLM)
- [ ] Tool execution patterns (async/sync, error handling)
- [ ] Tool result formatting (streaming vs complete)

## Advanced Features
- [ ] Background execution (run_in_background parameter)
- [ ] Permission system (wildcard patterns, per-agent restrictions)
- [ ] Tool chaining and composition
- [ ] Tool result caching (WebFetch 15-minute TTL pattern)

## Specific Tools (from tools-comparison.md)
- [ ] Bash tool patterns (shell execution, background processes)
- [ ] Read/Write/Edit patterns (file operations, fuzzy matching)
- [ ] Glob/Grep patterns (search strategies)
- [ ] LSP integration patterns (hover, diagnostics, completion)
- [ ] WebFetch/WebSearch patterns (HTTP requests, caching)
- [ ] MCP tool exposure patterns

## Error Handling
- [ ] Tool execution errors
- [ ] Permission denied scenarios
- [ ] Timeout handling
- [ ] Graceful degradation

## Testing
- [ ] Unit test patterns for tools
- [ ] Integration test patterns
- [ ] Mock strategies for external dependencies

## Reference Files
- `base_repositories/opencode-fork/packages/opencode/src/tool/registry.ts`
- `base_repositories/opencode-fork/packages/opencode/src/tool/bash.ts`
- `base_repositories/opencode-fork/packages/opencode/src/tool/edit.ts` (9 fuzzy-match strategies!)
- `tools-comparison.md` (63+ pages)

## To create knowledge:
```bash
/knowledge-create patterns/tool-development <topic-name>
```

Example:
```bash
/knowledge-create patterns/tool-development zod-schema-patterns
```
