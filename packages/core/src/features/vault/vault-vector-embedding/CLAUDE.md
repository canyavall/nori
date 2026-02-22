# Vector Embedding Flow

Generates vector embeddings for all knowledge entries and stores them in the vector search index.

## Steps

1. **Load knowledge entries** — Load all entries from database → [steps/01-load-knowledge-entries.json](steps/01-load-knowledge-entries.json)
2. **Generate embeddings** — Generate vectors using LLM → [steps/02-generate-embeddings.json](steps/02-generate-embeddings.json)
3. **Store vectors** — Write vectors to store → [steps/03-store-vectors.json](steps/03-store-vectors.json)
4. **Validate store** — Verify store integrity → [steps/04-validate-store.json](steps/04-validate-store.json)
