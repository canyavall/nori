# claude-code-safety-net - Architecture

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│  AI Coding Tool (Claude Code / OpenCode / Gemini)     │
│  User or AI requests bash command execution           │
└───────────────────┬──────────────────────────────────┘
                    │ PreToolUse hook (JSON via stdin)
                    ▼
┌──────────────────────────────────────────────────────┐
│  cc-safety-net CLI                                    │
│  src/bin/cc-safety-net.ts                             │
│                                                       │
│  Dispatcher:                                          │
│  --claude-code  → hooks/claude-code.ts                │
│  --gemini-cli   → hooks/gemini-cli.ts                 │
│  --copilot-cli  → hooks/copilot-cli.ts                │
│  explain <cmd>  → bin/explain/                        │
│  doctor         → bin/doctor/                         │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Hook Handler (e.g., hooks/claude-code.ts)            │
│  1. Read JSON from stdin                              │
│  2. Extract: tool_input.command, cwd, session_id      │
│  3. Call analyzeCommand(command, options)              │
│  4. Output: deny JSON or silent allow                 │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Analysis Engine (core/analyze.ts)                    │
│                                                       │
│  1. Load config (user + project scopes)               │
│  2. analyzeCommandInternal(command, depth=0, options)  │
│     │                                                 │
│     ├── splitShellCommands(command)                   │
│     │   Split on: && || | & ; \n                     │
│     │   Extract: $(...) and backtick substitutions    │
│     │                                                 │
│     └── For each segment:                             │
│         analyzeSegment(tokens, depth, options)        │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Segment Analyzer (core/analyze/segment.ts)           │
│                                                       │
│  Step 1: stripEnvAssignments                          │
│    VAR=value prefix → env map + TMPDIR detection      │
│                                                       │
│  Step 2: stripWrappers                                │
│    sudo, env, command, builtin → remove               │
│                                                       │
│  Step 3: Shell Wrapper Detection                      │
│    bash/sh/zsh -c "..." → extract + recurse           │
│                                                       │
│  Step 4: Interpreter Detection                        │
│    python/node/ruby/perl -c/-e "code"                 │
│    Paranoid mode: block all                           │
│    Normal: scan code for dangerous patterns           │
│                                                       │
│  Step 5: Busybox Unwrap                               │
│    busybox <cmd> → skip busybox, analyze <cmd>        │
│                                                       │
│  Step 6: Command-Specific Rules                       │
│    ┌─────────────────────────────────────────┐        │
│    │  Dispatch by command name:               │        │
│    │  git    → rules-git.ts                   │        │
│    │  rm     → rules-rm.ts                    │        │
│    │  find   → analyze/find.ts                │        │
│    │  xargs  → analyze/xargs.ts               │        │
│    │  parallel → analyze/parallel.ts           │        │
│    │  *      → rules-custom.ts                │        │
│    └─────────────────────────────────────────┘        │
│                                                       │
│  Step 7: CWD Change Detection                         │
│    cd/pushd/popd → effectiveCwd = null (unknown)      │
│                                                       │
│  Return: block reason + segment  OR  null (allowed)   │
└──────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── index.ts                          # OpenCode plugin export
├── types.ts                          # Shared types, TraceStep union
├── bin/
│   ├── cc-safety-net.ts              # Main CLI entry (dispatcher)
│   ├── commands/                     # Command definitions
│   │   ├── index.ts
│   │   ├── claude-code.ts
│   │   ├── copilot-cli.ts
│   │   ├── gemini-cli.ts
│   │   ├── doctor.ts
│   │   ├── explain.ts
│   │   ├── verify-config.ts
│   │   └── statusline.ts
│   ├── doctor/                       # Diagnostics system
│   ├── explain/                      # Debug trace output
│   ├── hooks/                        # Platform-specific handlers
│   │   ├── claude-code.ts            # stdin JSON → deny decision
│   │   ├── gemini-cli.ts
│   │   └── copilot-cli.ts
│   ├── help.ts
│   └── utils/colors.ts
├── core/
│   ├── analyze.ts                    # Entry point → delegates to segment
│   ├── analyze/
│   │   ├── analyze-command.ts        # Command splitting, recursion
│   │   ├── segment.ts               # Per-segment analysis dispatcher
│   │   ├── shell-wrappers.ts        # bash -c extraction
│   │   ├── interpreters.ts          # python -c, node -e detection
│   │   ├── xargs.ts                 # xargs expansion analysis
│   │   ├── parallel.ts              # GNU parallel expansion
│   │   ├── find.ts                  # find -delete/-exec detection
│   │   ├── rm-flags.ts              # -rf/-r -f flag detection
│   │   ├── tmpdir.ts                # TMPDIR override detection
│   │   ├── dangerous-text.ts        # Embedded command scanning
│   │   └── constants.ts
│   ├── rules-git.ts                  # Git subcommand rules (354 lines)
│   ├── rules-rm.ts                   # rm path classification (330 lines)
│   ├── rules-custom.ts              # Custom rule matching
│   ├── config.ts                     # Config loading/validation/merging
│   ├── shell.ts                      # Shell parsing (shell-quote wrapper)
│   ├── audit.ts                      # Audit logging + secret redaction
│   ├── env.ts                        # Environment variable helpers
│   └── format.ts                     # Block message formatting
├── features/
│   └── builtin-commands/             # Slash command templates
│       ├── commands.ts
│       └── templates/
│           ├── set-custom-rules.ts
│           └── verify-custom-rules.ts
tests/
├── core/
│   ├── rules-git.test.ts
│   ├── rules-rm.test.ts
│   ├── rules-custom-integration.test.ts
│   ├── config.test.ts
│   ├── audit.test.ts
│   ├── shell.test.ts
│   ├── analyze.test.ts
│   └── analyze/
│       ├── analyze-coverage.test.ts
│       ├── edge-cases.test.ts
│       ├── find.test.ts
│       └── parsing-helpers.test.ts
└── helpers.ts                        # assertBlocked, assertAllowed
```

## Analysis Pipeline Detail

```
Input: "sudo bash -c 'cd /tmp && git reset --hard && rm -rf ~/'"
                    │
        ┌───────────▼───────────────┐
        │  splitShellCommands()      │
        │  Result: 1 segment         │
        │  ["sudo", "bash", "-c",   │
        │   "cd /tmp && git reset   │
        │    --hard && rm -rf ~/"]   │
        └───────────┬───────────────┘
                    │
        ┌───────────▼───────────────┐
        │  stripEnvAssignments()     │
        │  No env vars found         │
        └───────────┬───────────────┘
                    │
        ┌───────────▼───────────────┐
        │  stripWrappers()           │
        │  Remove "sudo"             │
        │  → ["bash", "-c", "..."]   │
        └───────────┬───────────────┘
                    │
        ┌───────────▼───────────────┐
        │  Shell wrapper detected!   │
        │  bash -c "..."             │
        │  Extract inner command     │
        │  Recurse (depth=1)         │
        └───────────┬───────────────┘
                    │
        ┌───────────▼───────────────────────┐
        │  Inner: "cd /tmp && git reset     │
        │          --hard && rm -rf ~/"     │
        │                                    │
        │  splitShellCommands() →            │
        │  Segment 1: ["cd", "/tmp"]         │
        │  Segment 2: ["git", "reset",       │
        │              "--hard"]             │
        │  Segment 3: ["rm", "-rf", "~/"]    │
        └───────┬───────┬───────┬───────────┘
                │       │       │
                ▼       ▼       ▼
         cd /tmp   git reset   rm -rf ~/
         (CWD→     --hard
          null)    → BLOCK!    → BLOCK!
                   "git reset  "rm -rf targets
                    --hard      home directory"
                    destroys
                    uncommitted
                    changes"
```

## Config Merging

```
┌──────────────────────────┐
│ User scope:               │
│ ~/.cc-safety-net/         │
│   config.json             │
│   └── rules: [A, B, C]   │
└────────────┬─────────────┘
             │
             ▼  merge (project overrides user by name)
┌──────────────────────────┐
│ Project scope:            │
│ .safety-net.json          │
│   └── rules: [B', D]     │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Effective rules:          │
│ [A, B'(override), C, D]  │
└──────────────────────────┘
```
