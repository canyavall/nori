#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyze captured Claude Code API requests
Extracts and formats system prompts, CLAUDE.md content, skills, rules, etc.
"""

import json
import sys
import io
from pathlib import Path
from datetime import datetime
import mitmproxy.io
from mitmproxy.http import HTTPFlow

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def extract_text_content(content_list):
    """Extract text from content blocks"""
    if not isinstance(content_list, list):
        return str(content_list)

    texts = []
    for item in content_list:
        if isinstance(item, dict):
            if item.get('type') == 'text':
                texts.append(item.get('text', ''))
            elif 'text' in item:
                texts.append(item['text'])

    return '\n'.join(texts)

def analyze_request(flow: HTTPFlow, request_num: int, output_dir: Path):
    """Analyze a single API request"""

    if not flow.request.path.startswith('/v1/messages'):
        return

    try:
        body = json.loads(flow.request.content.decode('utf-8'))
    except:
        print(f"  ⚠️ Could not parse request body for request #{request_num}")
        return

    print(f"\n{'=' * 80}")
    print(f"REQUEST #{request_num}")
    print(f"{'=' * 80}")
    print(f"Timestamp: {flow.request.timestamp_start}")
    print(f"Model: {body.get('model', 'unknown')}")
    print(f"Max Tokens: {body.get('max_tokens', 'unknown')}")
    print(f"Temperature: {body.get('temperature', 'unknown')}")

    # Create detailed output file
    output_file = output_dir / f"request_{request_num:03d}.txt"

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"REQUEST #{request_num}\n")
        f.write(f"{'=' * 80}\n\n")
        f.write(f"Timestamp: {datetime.fromtimestamp(flow.request.timestamp_start)}\n")
        f.write(f"Model: {body.get('model', 'unknown')}\n")
        f.write(f"Max Tokens: {body.get('max_tokens', 'unknown')}\n")
        f.write(f"Temperature: {body.get('temperature', 'unknown')}\n\n")

        # Analyze system prompt
        system = body.get('system', [])
        if system:
            f.write(f"\n{'=' * 80}\n")
            f.write(f"SYSTEM PROMPT ({len(system)} blocks)\n")
            f.write(f"{'=' * 80}\n\n")

            for i, block in enumerate(system):
                f.write(f"\n--- System Block {i+1} ---\n")

                if isinstance(block, dict):
                    # Check for cache control
                    cache_control = block.get('cache_control', {})
                    if cache_control:
                        f.write(f"Cache Control: {cache_control.get('type', 'none')}\n\n")

                    # Get text content
                    text = block.get('text', '')

                    # Try to identify what this block contains
                    text_lower = text.lower()
                    if 'claude code' in text_lower and len(text) > 1000:
                        f.write("⭐ MAIN SYSTEM PROMPT\n\n")
                        print(f"  ✅ Found main system prompt ({len(text)} chars)")
                    elif 'claude.md' in text_lower or text.startswith('#'):
                        f.write("📄 CLAUDE.MD CONTENT\n\n")
                        print(f"  ✅ Found CLAUDE.md content ({len(text)} chars)")
                    elif 'skill' in text_lower and 'should be used when' in text_lower:
                        f.write("🎯 SKILL DEFINITION\n\n")
                        print(f"  ✅ Found skill definition ({len(text)} chars)")
                    elif 'rule' in text_lower or 'always' in text_lower or 'never' in text_lower:
                        f.write("📋 RULES CONTENT\n\n")
                        print(f"  ✅ Found rules content ({len(text)} chars)")

                    f.write(text)
                    f.write("\n\n")

        # Analyze messages
        messages = body.get('messages', [])
        if messages:
            f.write(f"\n{'=' * 80}\n")
            f.write(f"MESSAGES ({len(messages)} messages)\n")
            f.write(f"{'=' * 80}\n\n")

            for i, msg in enumerate(messages):
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')

                f.write(f"\n--- Message {i+1} ({role}) ---\n\n")

                if isinstance(content, str):
                    f.write(content)
                elif isinstance(content, list):
                    f.write(extract_text_content(content))

                f.write("\n\n")

        # Analyze tools
        tools = body.get('tools', [])
        if tools:
            f.write(f"\n{'=' * 80}\n")
            f.write(f"TOOLS ({len(tools)} tools)\n")
            f.write(f"{'=' * 80}\n\n")

            tool_names = [t.get('name', 'unknown') for t in tools]
            f.write(f"Registered tools: {', '.join(tool_names)}\n\n")

            print(f"  🔧 {len(tools)} tools: {', '.join(tool_names)}")

        # Full JSON dump
        f.write(f"\n{'=' * 80}\n")
        f.write(f"FULL REQUEST JSON\n")
        f.write(f"{'=' * 80}\n\n")
        f.write(json.dumps(body, indent=2))

    print(f"  💾 Saved detailed analysis to: {output_file.name}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze-capture.py <capture_file.mitm>")
        sys.exit(1)

    capture_file = Path(sys.argv[1])

    if not capture_file.exists():
        print(f"Error: Capture file not found: {capture_file}")
        sys.exit(1)

    # Create analysis output directory
    analysis_dir = capture_file.parent.parent / "analysis" / capture_file.stem
    analysis_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'=' * 80}")
    print(f"ANALYZING CLAUDE CODE API REQUESTS")
    print(f"{'=' * 80}")
    print(f"Input: {capture_file}")
    print(f"Output: {analysis_dir}")
    print()

    # Read and analyze flows
    request_count = 0

    with open(capture_file, "rb") as f:
        reader = mitmproxy.io.FlowReader(f)

        try:
            for flow in reader.stream():
                if isinstance(flow, HTTPFlow):
                    if flow.request.host == "api.anthropic.com":
                        request_count += 1
                        analyze_request(flow, request_count, analysis_dir)
        except Exception as e:
            print(f"\nWarning: Error reading flows: {e}")

    print(f"\n{'=' * 80}")
    print(f"ANALYSIS COMPLETE")
    print(f"{'=' * 80}")
    print(f"Total requests analyzed: {request_count}")
    print(f"Output directory: {analysis_dir}")
    print()

    if request_count == 0:
        print("⚠️ No requests found. Make sure you:")
        print("  1. Ran Claude Code through the proxy")
        print("  2. Used HTTPS_PROXY=http://localhost:8080")
        print("  3. Captured requests to api.anthropic.com")

if __name__ == "__main__":
    main()
