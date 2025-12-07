# Knowledge Loading Test Suite

**Version**: 1.0
**Created**: 2025-12-03
**Purpose**: Validate knowledge loading protocol compliance across all agents and user prompts

---

## Test Format

Each test includes:
1. **Test ID**: Unique identifier
2. **Test Prompt**: The user's question/request
3. **Expected Agent**: Which agent-profile should be invoked (or "user" for direct prompts)
4. **Expected Parameters**:
   - `agent-profile` or `command-profile` or `tags`
   - `task-type` (if Mode 1)
   - `with-deps` (MANDATORY - must be true)
5. **Expected Packages** (minimum): Required packages that MUST be loaded
6. **Validation Steps**: How to verify the test passed
7. **Pass Criteria**: What constitutes a successful test

---

## Test Cases

### Test 1: Routing Implementation (planning-agent)

**Test ID**: KL-001
**Scenario**: User runs `/task feco-0000` where ticket is about moving routes

**Test Prompt**:
```
/task feco-0000
```

**Ticket Content** (`.ai/specs/feco-0000/ticket.md`):
```
Move routes from libs/modules to app level for synergy-client and bank-client-eu apps
```

**Expected**:
- **Agent**: planning-agent (invoked by /task command)
- **Parameters**:
  - `--agent-profile`: planning-agent
  - `--task-type`: routing_implementation (detected from requirements.md)
  - `--with-deps`: true (MANDATORY)
  - `--agent-name`: planning-agent
  - `--agent-id`: planning-agent-feco-0000-[timestamp]

**Minimum Required Packages**:
- nx-commands (always_load)
- react-router-v7-basics
- react-router-navigation
- react-router-loaders
- react-router-permissions
- react-router-monorepo-patterns
- nx-architecture
- typescript-types (via --with-deps or always_load from implementation-agent)
- standards-code-conventions (via --with-deps or should be documented)

**Validation Steps**:
1. Run `/task feco-0000`
2. Check `.ai/knowledge/tracker/tracker.jsonl` for new entries:
   - First entry: `agent-profile: planning-agent`, no task-type (step 2)
   - Second entry: `agent-profile: planning-agent`, `task-type: routing_implementation` (step 6)
   - Both entries should have `with-deps` mentioned in command parameters (check mjs code)
3. Check `.ai/knowledge/tracker/metrics.jsonl` for aggregated data:
   - Search mode: `agent-profile`
   - Packages returned: ≥9
   - Agent name: planning-agent
4. Check `.ai/specs/feco-0000/plan.md` "Required Knowledge" section:
   - Should list ALL routing packages (9+)
   - Should include nx-commands
   - Should NOT have placeholders like `[category]/[topic]/[name].md`

**Pass Criteria**:
- ✅ tracker.jsonl has 2 entries with correct agent-profile + task-type
- ✅ metrics.jsonl shows ≥9 packages loaded in second search
- ✅ plan.md lists ≥9 knowledge packages in "Required Knowledge" section
- ✅ All package paths are real (no placeholders)
- ✅ Response includes routing-related packages (react-router-*, nx-*)

---

### Test 2: Component Implementation (implementation-agent)

**Test ID**: KL-002
**Scenario**: User asks to create a new component

**Test Prompt**:
```
Create a UserProfile component with name, email fields and a save button
```

**Expected**:
- **Agent**: user (direct prompt, not agent invocation)
- **Parameters** (suggested by hook):
  - `--agent-profile`: implementation-agent
  - `--task-type`: component_implementation
  - `--with-deps`: true
  - `--agent-name`: user
  - `--agent-id`: prompt-[timestamp]

**Minimum Required Packages**:
- react-component-patterns
- typescript-types
- standards-code-conventions
- component-structure
- hooks
- sidehooks

**Validation Steps**:
1. Send prompt to Claude Code
2. Check response starts with: `"Loaded: [list of packages]"` or equivalent
3. Check tracker.jsonl for new entry with agent-name: user
4. Check metrics.jsonl shows ≥3 packages loaded
5. Verify packages include component-related knowledge

**Pass Criteria**:
- ✅ Response starts with knowledge loading proof
- ✅ tracker.jsonl has entry with agent-name: user
- ✅ metrics.jsonl shows ≥3 packages
- ✅ Packages include react/component patterns
- ✅ Used `--with-deps` (inferred from package count)

---

### Test 3: Test Fixing (implementation-agent)

**Test ID**: KL-003
**Scenario**: User reports flaky tests

**Test Prompt**:
```
Fix the flaky tests in OrderDrawer.spec.tsx - tests are failing randomly
```

**Expected**:
- **Agent**: user
- **Parameters**:
  - `--agent-profile`: implementation-agent
  - `--task-type`: test_fixing
  - `--with-deps`: true
  - `--agent-name`: user
  - `--agent-id`: prompt-[timestamp]

**Minimum Required Packages**:
- testing-isolation
- testing-async-patterns
- msw-setup
- typescript-types
- standards-code-conventions

**Validation Steps**:
1. Send prompt
2. Check response mentions loading test-fixing knowledge
3. Check tracker.jsonl for agent-profile: implementation-agent, task-type: test_fixing
4. Check metrics.jsonl shows ≥3 packages
5. Verify packages include testing patterns

**Pass Criteria**:
- ✅ Loaded testing-related knowledge
- ✅ tracker.jsonl has correct parameters
- ✅ metrics.jsonl shows ≥3 packages
- ✅ Used `--with-deps`

---

### Test 4: AI Infrastructure Work

**Test ID**: KL-004
**Scenario**: User wants to modify knowledge system

**Test Prompt**:
```
Update knowledge.json to add a new task type for database migrations
```

**Expected**:
- **Agent**: user
- **Parameters**:
  - `--command-profile`: ai
  - `--with-deps`: true
  - `--agent-name`: user
  - `--agent-id`: prompt-[timestamp]

**Minimum Required Packages**:
- knowledge-system-overview
- agent-profiles
- task-type-configuration

**Validation Steps**:
1. Send prompt
2. Check response loaded AI infrastructure knowledge
3. Check tracker.jsonl shows command-profile: ai
4. Check metrics.jsonl shows AI-related packages
5. Verify no business/core implementation packages loaded (correct filtering)

**Pass Criteria**:
- ✅ Used Mode 2 (command-profile: ai)
- ✅ tracker.jsonl has command-profile entry
- ✅ Loaded AI infrastructure knowledge only
- ✅ Used `--with-deps`

---

### Test 5: Business Requirements (business-agent)

**Test ID**: KL-005
**Scenario**: Creating requirements for business feature

**Test Prompt**:
```
/create-requirements port-5500
```

**Ticket Content** (`.ai/specs/port-5500/ticket.md`):
```
Add margin call notifications for lombard loans when collateral value drops below threshold
```

**Expected**:
- **Agent**: business-agent (invoked by command)
- **Parameters**:
  - `--category`: business
  - `--tags`: lombard,credit (or similar)
  - `--with-deps`: true
  - `--agent-name`: business-agent
  - `--agent-id`: business-agent-port-5500-[timestamp]

**Minimum Required Packages**:
- Business knowledge related to credit/lombard
- Compliance rules
- Risk management concepts

**Validation Steps**:
1. Run `/create-requirements port-5500`
2. Check tracker.jsonl for category: business, tags include lombard/credit
3. Check metrics.jsonl shows business packages loaded
4. Check `.ai/specs/port-5500/requirements.md` references business concepts correctly

**Pass Criteria**:
- ✅ Used Mode 3 (category + tags)
- ✅ tracker.jsonl shows business category
- ✅ Loaded business domain knowledge
- ✅ Used `--with-deps`

---

### Test 6: No Knowledge Needed (Pure File Discovery)

**Test ID**: KL-006
**Scenario**: User asks for file listing (pure discovery, no knowledge needed)

**Test Prompt**:
```
List all .tsx files in apps/synergy-client/src/routes
```

**Expected**:
- **Agent**: user
- **Parameters**: NONE (should skip knowledge loading)
- **Action**: Direct use of Glob/Grep tools

**Validation Steps**:
1. Send prompt
2. Check response does NOT start with "Loaded: [packages]"
3. Response MUST start with: `"No knowledge needed: Pure file discovery operation"`
4. Check tracker.jsonl does NOT have new entry for this prompt timestamp
5. Check response directly provides file list (uses Glob tool)

**Pass Criteria**:
- ✅ Response starts with "No knowledge needed: [reason]"
- ✅ Reason is specific (not generic "Task is X")
- ✅ No new tracker.jsonl entry
- ✅ Direct file listing provided

---

### Test 7: Multi-Domain Task (Mode 3 Flexible)

**Test ID**: KL-007
**Scenario**: Task spans multiple domains (form + API + routing)

**Test Prompt**:
```
Create a user registration form that validates input, calls the /api/users endpoint, and redirects to dashboard on success
```

**Expected**:
- **Agent**: user
- **Parameters**:
  - **Option A** (Multiple Mode 1 calls):
    - `--agent-profile`: implementation-agent
    - `--task-type`: form_implementation, then api_implementation, then routing_implementation
    - `--with-deps`: true (all calls)
  - **Option B** (Single Mode 3 call - preferred for tight integration):
    - `--tags`: forms,api,routing
    - `--category`: core,libraries
    - `--with-deps`: true

**Minimum Required Packages**:
- Form validation patterns
- React-hook-form
- API integration patterns
- React-query
- Routing patterns
- TypeScript types
- Standards

**Validation Steps**:
1. Send prompt
2. Check tracker.jsonl for either:
   - Multiple entries with different task-types, OR
   - Single entry with multiple tags
3. Check metrics.jsonl shows packages from all 3 domains
4. Verify loaded packages cover forms, API, and routing

**Pass Criteria**:
- ✅ Loaded knowledge from all 3 domains (forms, API, routing)
- ✅ tracker.jsonl shows appropriate search strategy
- ✅ Used `--with-deps` in all searches
- ✅ Total packages ≥6 (covering multiple domains)

---

## Test Execution Guide

### Manual Execution

For each test:

1. **Setup**: Clear any previous tracker entries or note the current timestamp
2. **Execute**: Run the test prompt exactly as specified
3. **Capture**: Record the agent's response
4. **Validate**: Check each validation step
5. **Document**: Record PASS/FAIL with specific details

**Example execution log**:
```
Test ID: KL-001
Date: 2025-12-03 14:30:00
Prompt: /task feco-0000
Response: <full response>

Validation:
✅ tracker.jsonl has 2 entries
✅ metrics.jsonl shows 12 packages (>9 required)
✅ plan.md lists 12 packages in Required Knowledge
❌ Missing standards-code-conventions in plan.md

Result: FAIL - Missing standards packages in documentation
Action Required: Update planning-agent step 6 to ensure implementation-agent's always_load packages are included
```

### Checking Tracker Files

**tracker.jsonl format**:
```json
{"category":"nx","file":"nx-commands.md","agent_name":"planning-agent","agent_id":"planning-agent-feco-0000-1764778848","timestamp":"12-03 17:20:48"}
```

**metrics.jsonl format**:
```json
{"timestamp":"12-03 17:20:53","search_time_ms":4,"packages_returned":9,"packages_tracked":9,"tokens_estimated":1959,"search_mode":"agent-profile","agent_profile":"planning-agent","task_type":"routing_implementation","with_deps":false,"agent_name":"planning-agent","agent_id":"planning-agent-feco-0000-1764778848"}
```

**Validation commands**:
```bash
# Check last N entries in tracker
tail -5 .ai/knowledge/tracker/tracker.jsonl

# Check metrics for specific agent
grep "planning-agent" .ai/knowledge/tracker/metrics.jsonl | tail -2

# Count packages loaded
grep "planning-agent-feco-0000" .ai/knowledge/tracker/tracker.jsonl | wc -l

# Verify with-deps usage (check metrics)
grep "feco-0000" .ai/knowledge/tracker/metrics.jsonl | jq '.with_deps'
```

---

## Automated Testing (Future Enhancement)

**Script**: `.ai/knowledge/tests/run-tests.mjs`

**Functionality**:
1. For each test case:
   - Inject test prompt via API or file
   - Capture response
   - Parse tracker.jsonl before/after
   - Parse metrics.jsonl
   - Validate expected vs actual parameters
   - Check package counts and types
   - Report PASS/FAIL
2. Generate test report:
   - Total tests: 7
   - Passed: X
   - Failed: Y
   - Compliance rate: X%
3. Exit code 0 if all pass, 1 if any fail

**Usage**:
```bash
# Run all tests
node .ai/knowledge/tests/run-tests.mjs

# Run specific test
node .ai/knowledge/tests/run-tests.mjs --test KL-001

# Run with verbose output
node .ai/knowledge/tests/run-tests.mjs --verbose
```

---

## Continuous Monitoring

### Compliance Metrics

Track these metrics over time:

1. **`--with-deps` Usage Rate**: % of knowledge loads that include `--with-deps`
   - Target: 100%
   - Current: [measure]
   - Formula: (loads with --with-deps) / (total loads)

2. **Average Packages per Load**: Mean number of packages loaded per search
   - Target: ≥5 (indicates dependencies are loading)
   - Current: [measure]
   - Formula: sum(packages_returned) / count(searches)

3. **Knowledge Gap Rate**: % of tasks with 0 packages loaded
   - Target: 0% (every task should load something)
   - Current: [measure]
   - Formula: (searches returning 0 packages) / (total searches)

4. **Agent Consistency**: Variance in parameters used across agents
   - Target: Low variance (all following protocol)
   - Current: [measure]
   - Formula: std_dev(parameters_used)

### Dashboard Script

**Script**: `.ai/knowledge/tests/knowledge-health-dashboard.mjs`

**Output**:
```
Knowledge Loading Health Dashboard
Generated: 2025-12-03 15:45:00

Protocol Compliance:
  --with-deps Usage: 85% ⚠️ (Target: 100%)
  Avg Packages/Load: 6.2 ✅ (Target: ≥5)
  Zero-Result Rate: 2% ⚠️ (Target: 0%)

By Agent:
  planning-agent: 45 loads, avg 9.1 packages, 90% with-deps ⚠️
  implementation-agent: 78 loads, avg 5.3 packages, 100% with-deps ✅
  tech-design-agent: 12 loads, avg 4.2 packages, 80% with-deps ⚠️
  business-agent: 8 loads, avg 3.1 packages, 100% with-deps ✅
  qa-agent: 5 loads, avg 2.8 packages, 100% with-deps ✅

Most Loaded Packages (Top 5):
  1. typescript-types: 123 loads
  2. standards-code-conventions: 98 loads
  3. nx-commands: 87 loads
  4. react-router-v7-basics: 45 loads
  5. react-component-patterns: 34 loads

Knowledge Gaps (Searches with 0 results):
  - prompt-1733245678: tags=[business,risk] → Overly restrictive
  - prompt-1733245890: text="specific term" → Text filter too narrow

Recommendations:
  ⚠️ planning-agent: Enforce --with-deps (currently 90%)
  ⚠️ tech-design-agent: Enforce --with-deps (currently 80%)
  ✅ All agents: Following agent-profile pattern correctly
```

---

## Test Results Log

### 2025-12-03 Initial Test Run

| Test ID | Status | Notes |
|---------|--------|-------|
| KL-001 | ❌ FAIL | planning-agent loaded only 9 packages, missing standards |
| KL-002 | ⏳ PENDING | Not yet tested |
| KL-003 | ⏳ PENDING | Not yet tested |
| KL-004 | ⏳ PENDING | Not yet tested |
| KL-005 | ⏳ PENDING | Not yet tested |
| KL-006 | ⏳ PENDING | Not yet tested |
| KL-007 | ⏳ PENDING | Not yet tested |

**Overall Compliance**: 0/7 (0%)

**Action Items**:
1. Update planning-agent.md to add `--with-deps` to all searches
2. Ensure plan.md documents implementation-agent's always_load packages
3. Re-run KL-001 after fixes
4. Execute remaining tests

---

## Success Criteria

Protocol is considered **validated** when:

- ✅ All 7 tests pass
- ✅ `--with-deps` usage rate = 100%
- ✅ Average packages per load ≥ 5
- ✅ Zero-result rate = 0%
- ✅ All agents following protocol consistently

**Target Date**: 2025-12-10 (1 week)

---

**Version History**:
- v1.0 (2025-12-03): Initial test suite with 7 test cases
