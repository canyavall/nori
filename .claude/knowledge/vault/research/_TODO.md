# Research Knowledge TODO

This folder is for research findings and comparative analysis between OpenCode and Claude Code.

## Comparison Analysis
- [ ] Hooks system findings (from hooks-comparison.md)
- [ ] Skills system analysis (from skills-comparison.md)
- [ ] Agent architecture insights (from agents-comparison.md)
- [ ] Command system breakdown (from commands-comparison.md)
- [ ] Tool system differences (from tools-comparison.md)
- [ ] Context management strategies (from context-management-comparison.md)

## Implementation Insights
- [ ] Feature parity matrix (what's missing, what's better)
- [ ] Confidence levels per system (from GAP-ANALYSIS.md)
- [ ] Implementation roadmap learnings (from MASTER-ROADMAP.md)
- [ ] Testing validation results (from QUICK-START-TOMORROW.md tests)

## Architecture Deep Dives
- [ ] OpenCode architecture findings (from ARCHITECTURE.md)
- [ ] Claude Code architecture guide notes (from claude-code-architecture-guide.md)
- [ ] Multi-client architecture patterns
- [ ] Plugin system vs native features

## Critical Unknowns (to document as discovered)
- [ ] Agent selection algorithm details
- [ ] wU2 compactor heuristics
- [ ] Permission system edge cases
- [ ] Tool error handling internals
- [ ] Session persistence format details

## Reference Documents
All root-level markdown files (270+ pages total):
- `hooks-comparison.md` (45 pages)
- `skills-comparison.md` (40 pages)
- `agents-comparison.md` (50 pages)
- `commands-comparison.md` (35 pages)
- `tools-comparison.md` (63 pages)
- `context-management-comparison.md` (40 pages)
- `GAP-ANALYSIS.md` (detailed confidence assessment)
- `MASTER-ROADMAP.md` (4-phase implementation plan)

## To create knowledge:
```bash
/knowledge-create research <topic-name>
```

Example:
```bash
/knowledge-create research hooks-system-findings
```

Note: Keep research knowledge separate from implementation patterns for clarity.
