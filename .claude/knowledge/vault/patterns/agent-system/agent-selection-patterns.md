---
tags:
  - agent-system
  - patterns
  - agent-selection
  - task-routing
description: >-
  Agent selection patterns from Claude Code: confidence-based routing, task complexity
  mapping, and agent capability matrix
category: patterns/agent-system
required_knowledge: []
---
# Agent Selection Patterns

Patterns for selecting appropriate agents based on task characteristics and confidence levels.

## Agent Types and Capabilities

**general-purpose**: Multi-step research, complex analysis, open-ended exploration
**code**: Focused code modifications, single-file changes
**build**: Compilation, dependency issues, build failures
**plan**: Architecture design, implementation planning
**deploy**: Deployment operations, infrastructure changes

## Selection Algorithm (Inferred)

```
Task Analysis:
├─ Complexity: Simple | Moderate | Complex
├─ Scope: Single file | Multi-file | Architecture
├─ Domain: Code | Build | Deploy | Research
└─ Certainty: High | Medium | Low

Agent Selection:
├─ Simple + High certainty → code agent
├─ Complex + Low certainty → general-purpose agent
├─ Build errors → build agent
├─ Architecture decisions → plan agent
└─ Infrastructure changes → deploy agent
```

## Confidence Levels

**High (85%+)**: Clear requirements, known patterns → Specialized agent
**Medium (65-85%)**: Some ambiguity → General-purpose agent
**Low (<65%)**: Uncertain scope → General-purpose agent with research

## Sub-agent Spawning

When general-purpose agent spawns specialized sub-agents:
- Research phase: general-purpose agent explores
- Implementation phase: spawns code/build agents for execution
- Coordination: parent agent aggregates results

## Source

Extracted from `documentation/agents-comparison.md` - Claude Code agent architecture analysis
