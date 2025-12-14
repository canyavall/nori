#!/usr/bin/env python3
"""
Quick test script to verify Claude Code can be intercepted
Sends a simple test message and checks if proxy captures it
"""

import subprocess
import os
import sys
import time
from pathlib import Path

TRACKER_DIR = Path(__file__).parent.parent

print("=" * 80)
print("QUICK PROXY TEST")
print("=" * 80)
print()
print("This will:")
print("  1. Start mitmproxy in background")
print("  2. Send a test message through Claude Code")
print("  3. Check if the request was captured")
print()

# Check if claude is available
try:
    result = subprocess.run(['claude', '--version'], capture_output=True, text=True)
    print(f"✅ Claude Code found: {result.stdout.strip()}")
except FileNotFoundError:
    print("❌ Claude Code CLI not found in PATH")
    print("   Please install Claude Code first")
    sys.exit(1)

print()
input("Press ENTER to start test...")

# Start mitmproxy in background
print("\n1. Starting mitmproxy on port 8080...")
mitm_process = subprocess.Popen(
    [sys.executable, "-m", "mitmproxy", "-p", "8080", "--quiet"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

# Give it time to start
time.sleep(3)

# Test Claude Code through proxy
print("2. Sending test message through Claude Code...")
print("   Prompt: 'Say hello in exactly 3 words'")

env = os.environ.copy()
env['HTTPS_PROXY'] = 'http://localhost:8080'

try:
    result = subprocess.run(
        ['claude', '-p', 'Say hello in exactly 3 words'],
        env=env,
        capture_output=True,
        text=True,
        timeout=30
    )

    print(f"\n   Response: {result.stdout.strip()[:100]}")

    if result.returncode == 0:
        print("   ✅ Claude Code executed successfully")
    else:
        print(f"   ⚠️ Claude Code returned error: {result.stderr}")

except subprocess.TimeoutExpired:
    print("   ⚠️ Claude Code timed out (30s)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Stop mitmproxy
print("\n3. Stopping mitmproxy...")
mitm_process.terminate()
mitm_process.wait()

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
print()
print("If everything worked, the request was intercepted!")
print()
print("Next steps:")
print("  1. Run: python scripts/start-capture.py")
print("  2. In another terminal: HTTPS_PROXY=http://localhost:8080 claude -p \"your prompt\"")
print("  3. Analyze: python scripts/analyze-capture.py captures/claude_requests_*.mitm")
