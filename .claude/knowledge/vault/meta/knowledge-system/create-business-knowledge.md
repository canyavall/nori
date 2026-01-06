---
tags:
  - ai-infrastructure
  - knowledge-system
  - knowledge-creation
description: >-
  Business knowledge documents domain-specific requirements, rules, and
  workflows.
category: meta/knowledge-system
required_knowledge: []
---
# Business Knowledge Creation Patterns

Business knowledge documents domain-specific requirements, rules, and workflows.

## Standard File Structure

Split business knowledge into focused files (≤1500 tokens / ~6000 characters each):

1. **[domain]-overview.md** - Purpose, value proposition, users
2. **[domain]-business-model.md** - Core business model, unique approach (if applicable)
3. **[domain]-business-rules.md** - Rules, constraints, limits
4. **[domain]-workflows.md** - User journeys (split if >1500 tokens)
5. **[domain]-integrations.md** - System integrations
6. **[domain]-terminology.md** - Business terms & definitions
7. **[domain]-metrics.md** - Success metrics & KPIs
8. **[domain]-risks.md** - Business & implementation risks
9. **[domain]-roadmap.md** - Future plans (optional)

Adjust based on complexity. Large domains: more files. Small domains: combine. Prioritize completeness over splitting.

## Discovery Process

Use Socratic interview (8-10 questions) with technical context from code:

**Preparation**: Analyze folder structure, extract components, types, operations, APIs.

**Questions**:
1. What business problem does [domain] solve? (1-2 sentences)
2. Who are primary users? What are they achieving?
3. Unique business model or approach?
4. Key business rules? (minimums, maximums, timing, constraints)
5. For each action in code, what are business requirements?
6. Describe 2-3 typical user journeys (step-by-step)
7. What can go wrong? Business risks?
8. Business terms that differ from technical names?
9. How measure success? What metrics?
10. What systems/features connect to [domain]?

Wait for each answer before next question.

## File Content Format

Each file:
- Title: # [Domain] [Topic]
- Brief intro: 1-2 sentences
- Content: ## headers, bullet points
- NO YAML frontmatter (plain markdown)
- ≤1500 tokens (~6000 characters)

## knowledge.json Entry

Each file needs entry in "business/[domain]" category:

```json
"[domain]-[topic]": {
  "tags": ["business", "[domain]", "[specific-tags]"],
  "description": "Brief description",
  "required_knowledge": [],
  "optional_knowledge": ["[related-file]"],
  "knowledge_path": ".claude/knowledge/vault/business/[domain]/[domain]-[topic]/[domain]-[topic].md",
  "category": "business/[domain]"
}
```

**Example:**
```json
"trading-overview": {
  "tags": ["business", "trading", "order-management"],
  "description": "Trading platform overview, users, and capabilities",
  "required_knowledge": [],
  "knowledge_path": ".claude/knowledge/vault/business/trading/trading-overview/trading-overview.md",
  "category": "business/trading"
}
```
