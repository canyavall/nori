# ccusage - Use Cases

## Primary Use Cases

### 1. Daily Cost Monitoring
**Who**: Any Claude Code user concerned about API costs.
**What**: Run `ccusage` (or `ccusage daily`) to see a table of daily token usage and estimated costs.
**Value**: Instant visibility into spending patterns. Identify expensive days, see which models drive costs.

### 2. Billing Block Tracking
**Who**: Pro/Max subscribers who hit rate limits.
**What**: `ccusage blocks --active` shows the current 5-hour billing window with burn rate and projected final usage.
**Value**: Understand Claude's billing model. See if you're on track to hit limits. Make informed decisions about pausing or switching models.

### 3. Project-Level Cost Attribution
**Who**: Teams or freelancers tracking costs per project.
**What**: `ccusage daily --instances --project myproject` filters to a specific project with per-day breakdown.
**Value**: Cost attribution for billing clients or tracking project budgets.

### 4. Model Usage Analysis
**Who**: Users optimizing their model selection strategy.
**What**: `ccusage daily --breakdown` shows per-model cost breakdown within each day.
**Value**: See the cost difference between Opus and Sonnet usage. Identify opportunities to use cheaper models.

### 5. JSON Export for Automation
**Who**: Teams building usage dashboards or automations.
**What**: `ccusage daily --json --jq '.daily[] | select(.totalCost > 10)'` produces structured data for downstream processing.
**Value**: Integration with monitoring tools, spreadsheets, or billing systems.

### 6. Session Investigation
**Who**: Users investigating an unexpectedly expensive session.
**What**: `ccusage session --id <session-id>` looks up a specific session's total usage.
**Value**: Drill down from "today cost $50" to "this session used 300k tokens".

### 7. Statusline Integration
**Who**: Users who want passive cost awareness.
**What**: Configure ccusage as Claude Code's statusline to show live cost, context usage, and burn rate.
**Value**: Always-visible cost information without running separate commands.

## Secondary Use Cases

### 8. Monthly Reporting
Generate monthly summaries for accounting or expense reports. Export as JSON for further processing.

### 9. Historical Trend Analysis
Use date range filters (`--since`, `--until`) to compare usage patterns across different time periods.

### 10. Cost Mode Comparison
Compare Claude's pre-calculated costs (`--mode display`) with token-based calculations (`--mode calculate`) to verify billing accuracy.

### 11. Timezone-Aware Reporting
Use `--timezone Asia/Tokyo` to group usage by local date, important for teams across time zones.

## Limitations

- **Read-only**: Only reads existing JSONL files, cannot modify Claude Code behavior
- **Local data only**: Cannot aggregate from multiple machines (unless files are synced)
- **No real-time streaming**: Reports are snapshots, not live dashboards (except statusline)
- **Pricing accuracy**: LiteLLM pricing may lag behind actual pricing changes
- **No alerts/budgets**: Cannot set spending limits or send notifications
