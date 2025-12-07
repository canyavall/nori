# OpenCode Setup Fix 🔧

## The Problem

OpenCode uses **pnpm** (not npm) because it's a monorepo with the `catalog:` protocol.

The error you got:
```
npm error Unsupported URL Type "catalog:": catalog:
```

This means you tried to use `npm install` but OpenCode requires `pnpm`.

## The Solution

### Option 1: Install pnpm (Recommended)

**Install pnpm globally:**
```bash
npm install -g pnpm
```

**Then install dependencies:**
```bash
cd C:\Users\canya\Documents\projects\nori\opencode-fork
pnpm install
```

**Run OpenCode:**
```bash
pnpm dev
# or
pnpm opencode
```

### Option 2: Use the Original OpenCode (Simpler for Testing)

If you just want to test OpenCode quickly, use the original version:

```bash
# Go back to parent directory
cd C:\Users\canya\Documents\projects\nori

# Clone fresh OpenCode
git clone https://github.com/sst/opencode.git opencode-original

# Enter directory
cd opencode-original

# Install with pnpm
npm install -g pnpm
pnpm install

# Set your API key
set ANTHROPIC_API_KEY=your_key_here

# Run it
pnpm opencode
```

Then you can compare with our stripped version later.

### Option 3: Convert to Regular npm (Advanced)

If you really want to avoid pnpm, you need to convert the catalog references:

1. Find all `catalog:` references in package.json files
2. Replace with actual version numbers
3. Remove pnpm-workspace.yaml

**This is complex and not recommended for testing.**

## Recommended Workflow for Tomorrow

### Quick Testing (30 minutes)

1. **Install pnpm:**
   ```bash
   npm install -g pnpm
   ```

2. **Use original OpenCode:**
   ```bash
   cd C:\Users\canya\Documents\projects\nori
   git clone https://github.com/sst/opencode.git opencode-test
   cd opencode-test
   pnpm install
   ```

3. **Configure for Claude only:**
   ```bash
   # Create config file
   echo '{
     "model": "anthropic/claude-sonnet-4-5",
     "provider": "anthropic"
   }' > opencode.json

   # Set API key
   set ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

4. **Run it:**
   ```bash
   pnpm opencode
   ```

### Deeper Testing (2+ hours)

Once basic testing works, then:

1. Compare with our stripped version in `opencode-fork/`
2. Verify our changes didn't break anything
3. Test Claude-only configuration
4. Run validation tests from GAP-ANALYSIS.md

## OpenCode Commands with pnpm

```bash
# Install dependencies
pnpm install

# Run OpenCode CLI
pnpm opencode

# Run in development mode
pnpm dev

# Build the project
pnpm build

# Run tests
pnpm test

# Clean and reinstall
pnpm clean
pnpm install
```

## Configuration Files

### Create opencode.json in your project:

```json
{
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  "provider": "anthropic",

  "tools": {
    "write": true,
    "read": true,
    "bash": "ask",
    "edit": true,
    "grep": true,
    "glob": true
  },

  "permissions": {
    "bash": "ask",
    "write": "ask"
  }
}
```

### Create .env file (optional):

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Troubleshooting

### pnpm not found after install

**Windows:**
1. Close and reopen terminal
2. Or restart VS Code
3. Check: `pnpm --version`

**Still not working:**
```bash
# Add to PATH manually
npm config get prefix
# Add that path + \pnpm to your system PATH
```

### Dependencies fail to install

```bash
# Clear pnpm cache
pnpm store prune

# Try again
pnpm install --force
```

### OpenCode won't start

```bash
# Check Node version (need 18+)
node --version

# Update if needed
nvm install 22
nvm use 22

# Try again
pnpm install
pnpm opencode
```

### API key not recognized

```bash
# Windows Command Prompt
set ANTHROPIC_API_KEY=sk-ant-your-key

# Windows PowerShell
$env:ANTHROPIC_API_KEY="sk-ant-your-key"

# Or add to opencode.json
{
  "anthropic": {
    "apiKey": "sk-ant-your-key"
  }
}
```

## What About Our Modified opencode-fork/?

Our stripped version in `opencode-fork/` has the same pnpm requirement.

**Two options:**

### Option A: Keep it for reference
- Use `opencode-fork/` as code reference
- Read the documentation we created
- Test with fresh clone instead
- Compare implementations later

### Option B: Fix it to work
- Install pnpm
- Test our stripped version
- Verify it works with Claude only
- Document any issues

**Recommendation:** Option A for now (use fresh clone for testing)

## Updated Testing Plan for Tomorrow

### Phase 1: Get OpenCode Running (30 min)

```bash
# 1. Install pnpm
npm install -g pnpm

# 2. Clone fresh OpenCode
cd C:\Users\canya\Documents\projects\nori
git clone https://github.com/sst/opencode.git opencode-test

# 3. Install dependencies
cd opencode-test
pnpm install

# 4. Configure for Claude
echo '{
  "model": "anthropic/claude-sonnet-4-5",
  "provider": "anthropic"
}' > opencode.json

# 5. Set API key
set ANTHROPIC_API_KEY=your_key_here

# 6. Run it!
pnpm opencode
```

### Phase 2: Test Basic Functionality (30 min)

Once running:
- Try `/init` command
- Test file operations (read, write)
- Try bash commands
- Switch between agents (Tab key)
- Test simple code generation

### Phase 3: Validation Tests (1-2 hours)

Run tests from GAP-ANALYSIS.md:
- Hook behavior
- Skill activation
- Agent selection
- Tool permissions
- Context compaction

### Phase 4: Compare with Documentation (1 hour)

Verify our documentation is accurate:
- Check architecture docs
- Validate feature descriptions
- Update confidence levels
- Note any discrepancies

## Quick Reference

**Essential Commands:**
```bash
pnpm install          # Install dependencies
pnpm opencode         # Run OpenCode CLI
pnpm dev              # Development mode
pnpm build            # Build project
```

**Essential Files:**
```
opencode.json         # Project config
.env                  # Environment variables (API keys)
~/.config/opencode/   # Global config
```

**Essential Environment Variables:**
```
ANTHROPIC_API_KEY     # Your Anthropic API key (required)
OPENCODE_CONFIG_DIR   # Custom config directory (optional)
```

## Why pnpm?

OpenCode uses pnpm because:
1. **Monorepo support** - Better workspace management
2. **Faster** - More efficient than npm
3. **Disk space** - Shares dependencies across projects
4. **catalog:** - New protocol for version management

The `catalog:` protocol is pnpm's way of managing versions across workspace packages.

## Alternative: Use Pre-built Binary

If pnpm is too much hassle, OpenCode might have pre-built binaries:

```bash
# Check releases
# https://github.com/sst/opencode/releases

# Download and run binary instead of building from source
```

## Summary

**Problem:** OpenCode needs pnpm, not npm

**Solution:** Install pnpm globally
```bash
npm install -g pnpm
```

**Then:**
```bash
cd opencode-test  # or opencode-fork
pnpm install
pnpm opencode
```

**For tomorrow:**
- Use fresh clone for testing (easier)
- Keep opencode-fork/ for reference
- Focus on validation, not setup
- Document findings in GAP-ANALYSIS.md

---

**You're just one command away from running OpenCode!** 🚀

```bash
npm install -g pnpm
```

Then you're good to go! 🎉
