#!/usr/bin/env python3
"""
Claude Code Request Interceptor
Captures all API requests from Claude Code CLI to analyze system prompts,
CLAUDE.md loading, skills, rules, and hooks behavior.
"""

import subprocess
import os
import sys
from datetime import datetime
from pathlib import Path

# Directories
TRACKER_DIR = Path(__file__).parent.parent
CAPTURES_DIR = TRACKER_DIR / "captures"
CAPTURES_DIR.mkdir(exist_ok=True)

# Create timestamped capture file
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
capture_file = CAPTURES_DIR / f"claude_requests_{timestamp}.mitm"

print("=" * 80)
print("CLAUDE CODE REQUEST INTERCEPTOR")
print("=" * 80)
print()
print("This will capture ALL API requests from Claude Code to Anthropic's API.")
print("You'll be able to see:")
print("  - Complete system prompts")
print("  - CLAUDE.md content (if loaded)")
print("  - Skills and rules configuration")
print("  - Tool definitions")
print("  - Request/response bodies")
print()
print(f"Capture will be saved to: {capture_file}")
print()
print("=" * 80)
print("SETUP INSTRUCTIONS:")
print("=" * 80)
print()
print("1. First time only: Install mitmproxy certificate")
print("   - Open browser and go to: http://mitm.it")
print("   - Download and install the certificate for your OS")
print()
print("2. In ANOTHER terminal, run Claude Code through the proxy:")
print()
print("   Windows (PowerShell):")
print("     $env:HTTPS_PROXY='http://localhost:8080'")
print("     claude -p \"your prompt here\"")
print()
print("   Windows (Git Bash):")
print("     HTTPS_PROXY=http://localhost:8080 claude -p \"your prompt here\"")
print()
print("   Linux/macOS:")
print("     HTTPS_PROXY=http://localhost:8080 claude -p \"your prompt here\"")
print()
print("3. All requests will appear in this window")
print()
print("4. Press 'q' to quit and save the capture")
print()
print("=" * 80)
print()

input("Press ENTER to start capturing...")

# Start mitmproxy
print("\nStarting mitmproxy on port 8080...")
print("Use another terminal to run Claude Code commands")
print()

try:
    # Run mitmproxy with save option
    subprocess.run([
        sys.executable, "-m", "mitmproxy",
        "-p", "8080",
        "--set", f"flow_detail=3",
        "--set", f"save_stream_file={capture_file}",
        "--set", "stream_large_bodies=1m",
        # Filter only Anthropic API calls
        "--set", "view_filter=~d api.anthropic.com"
    ])
except KeyboardInterrupt:
    print("\n\nCapture stopped by user")

print(f"\nCapture saved to: {capture_file}")
print("\nTo analyze the captured requests, run:")
print(f"  python {TRACKER_DIR}/scripts/analyze-capture.py {capture_file}")
