# Knowledge Delete Flow

Deletes a knowledge entry after checking dependencies.

## Steps

1. **Validate entry exists** — Verify the entry exists in vault → [steps/01-validate-entry-exists.json](steps/01-validate-entry-exists.json)
2. **Check dependencies** — Check if other entries depend on this one → [steps/02-check-dependencies.json](steps/02-check-dependencies.json)
3. **Delete file** — Remove markdown file from vault → [steps/03-delete-file.json](steps/03-delete-file.json)
4. **Regenerate index** — Rebuild index (flow_call) → [steps/04-regenerate-index.json](steps/04-regenerate-index.json)
