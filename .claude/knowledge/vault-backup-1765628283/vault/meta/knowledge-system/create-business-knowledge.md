# Business Knowledge Creation Patterns

Business knowledge documents domain-specific requirements, rules, and workflows.

## Standard File Structure

Split business knowledge into focused files (≤120 lines each):

1. **[domain]-overview.md** - Purpose, value proposition, users
2. **[domain]-business-model.md** - Core business model, unique approach (if applicable)
3. **[domain]-business-rules.md** - Rules, constraints, limits
4. **[domain]-workflows.md** - User journeys (split if >120 lines)
5. **[domain]-integrations.md** - System integrations
6. **[domain]-terminology.md** - Business terms & definitions
7. **[domain]-metrics.md** - Success metrics & KPIs
8. **[domain]-risks.md** - Business & implementation risks
9. **[domain]-roadmap.md** - Future plans (optional)

Adjust based on complexity. Large domains: more files. Small domains: combine.

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
- ≤120 lines

## knowledge.json Entry

Each file needs entry in "business" category:

```json
"[domain]-[topic]": {
  "tags": ["business", "[domain]", "[specific-tags]"],
  "description": "Brief description",
  "used_by_agents": ["requirements-agent"],
  "required_knowledge": [],
  "optional_knowledge": ["[related-file]"],
  "knowledge_path": ".ai/knowledge/business/[domain]/[domain]-[topic].md"
}
```
