# Vault Reconciliation Flow

Compares local, remote, and cached vault states using 3-way merge detection. Generates conflict report.

## Steps

1. **Load local state** — Read local vault file hashes → [steps/01-load-local-state.json](steps/01-load-local-state.json)
2. **Load remote state** — Fetch remote vault file hashes → [steps/02-load-remote-state.json](steps/02-load-remote-state.json)
3. **Load cache state** — Read cached state from last sync → [steps/03-load-cache-state.json](steps/03-load-cache-state.json)
4. **Compare three-way** — Run 3-way comparison across all files → [steps/04-compare-three-way.json](steps/04-compare-three-way.json)
5. **Generate report** — Build reconciliation report → [steps/05-generate-report.json](steps/05-generate-report.json)
6. **Save cache** — Update cache state → [steps/06-save-cache.json](steps/06-save-cache.json)
