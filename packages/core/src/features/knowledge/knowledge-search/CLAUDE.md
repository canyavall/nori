# Knowledge Search Flow

Searches knowledge entries using keyword matching, filters, and semantic vector search.

## Steps

1. **Load index** — Load knowledge index → [steps/01-load-index.json](steps/01-load-index.json)
2. **Parse query** — Parse search query into filters → [steps/02-parse-query.json](steps/02-parse-query.json)
3. **Match entries** — Filter entries matching criteria → [steps/03-match-entries.json](steps/03-match-entries.json)
4. **Score relevance** — Rank matched entries → [steps/04-score-relevance.json](steps/04-score-relevance.json)
5. **Semantic search** — Query vector store for semantic matches → [steps/05-semantic-search.json](steps/05-semantic-search.json)
6. **Merge results** — Merge keyword and semantic results → [steps/06-merge-results.json](steps/06-merge-results.json)
7. **Output results** — Format and return results → [steps/07-output-results.json](steps/07-output-results.json)
