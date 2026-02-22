# Knowledge Feature

Manages knowledge entries: CRUD operations, auditing, index building, and search (keyword + semantic).

## Flows

### [knowledge-create/](knowledge-create/)
Creates a new knowledge entry. Validates frontmatter and content, writes markdown file, audits the entry, and rebuilds the index.

### [knowledge-edit/](knowledge-edit/)
Edits an existing knowledge entry. Loads current content, validates changes, writes updates (atomic write), audits, and rebuilds index.

### [knowledge-delete/](knowledge-delete/)
Deletes a knowledge entry. Checks dependencies, removes the file, and rebuilds the index.

### [knowledge-audit/](knowledge-audit/)
Audits a single knowledge entry: validates frontmatter schema, checks content quality, and verifies the content is not generic AI boilerplate.

### [knowledge-index-build/](knowledge-index-build/)
Builds the searchable knowledge index from vault markdown files. Includes a fast-path mtime check to skip unnecessary rebuilds (~10ms vs ~120ms).

### [knowledge-search/](knowledge-search/)
Searches knowledge entries using keyword matching, category/tag filters, and semantic vector search. Returns ranked, deduplicated results.

## Triggers

- `createKnowledgeButton.onClick` → knowledge-create THEN knowledge-audit THEN vault-regenerate-db
- `editKnowledgeButton.onClick` → knowledge-edit THEN knowledge-audit THEN vault-regenerate-db
- `deleteKnowledgeButton.onClick` → knowledge-delete THEN vault-regenerate-db
- `auditKnowledgeButton.onClick` → knowledge-audit
