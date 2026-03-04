# Code Quality Plans — Index

Source: `analysis/nori-app/code-quality-plan.md`
Date: 2026-03-03

---

## Plans

| # | File | Title | Phase | Status  |
|---|------|--------|-------|---------|
| 01 | [plan-01-db-layer.md](plan-01-db-layer.md) | Fix the DB layer — typed row mappers | 1 | done    |
| 02 | [plan-02-migrations.md](plan-02-migrations.md) | Fix migration versioning | 2 | done    |
| 03 | [plan-03-audit-stub.md](plan-03-audit-stub.md) | Wire the audit stub | 2 | pending |
| 04 | [plan-04-index-updates.md](plan-04-index-updates.md) | Consolidate index update paths | 1+2 | pending |
| 05 | [plan-05-hook-splits.md](plan-05-hook-splits.md) | Split large hooks using sideHooks pattern | 3 | pending |
| 06 | [plan-06-event-naming.md](plan-06-event-naming.md) | Standardize SSE event naming | 2 | pending |
| 07 | [plan-07-error-boundaries.md](plan-07-error-boundaries.md) | Add SolidJS error boundaries | 3 | pending |
| 08 | [plan-08-integration-tests.md](plan-08-integration-tests.md) | Add integration tests for critical flows | 4 | pending |
| 09 | [plan-09-style-decision.md](plan-09-style-decision.md) | Resolve the .style.ts gap | 4 | pending |

## Execution Phases

| Phase | Plans | Goal |
|-------|-------|------|
| Phase 1 | 01, 04c | Eliminate `as unknown as`. Highest-impact, self-contained |
| Phase 2 | 02, 03, 06 | Correctness and consistency |
| Phase 3 | 05, 07 | Maintainability and resilience |
| Phase 4 | 08, 09 | Coverage and convention alignment |

## Validation Notes

All 9 items are valid and actionable:
- Plans 01–04 address root causes (DB layer, migrations, stubs, index divergence)
- Plans 05–07 address maintainability (hook size, error resilience)
- Plans 08–09 address coverage and convention alignment
- Execution order is correct: DB layer fix in Plan 01 unblocks shared query helpers used in Plans 03 and 04
