# Knowledge Feature (Frontend)

UI flows for knowledge management. Connects to backend knowledge flows via contracts in @nori/shared.

## Flows

### [knowledge-create/](knowledge-create/)
Wizard for creating knowledge entries. Frontmatter form → content editor → preview → backend call → audit results.

### [knowledge-edit/](knowledge-edit/)
Flow for editing existing entries. Load → edit form → backend call → audit results.

### [knowledge-delete/](knowledge-delete/)
Confirmation dialog for deletion. Confirm → backend call → result.

### [knowledge-search/](knowledge-search/)
Search interface. Query form → backend call → results display.
