#!/bin/bash
# Quick start script for Git Bash

MITM_EXE="/c/Users/canya/AppData/Local/Packages/PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0/LocalCache/local-packages/Python313/Scripts/mitmproxy.exe"

echo "========================================"
echo "Claude Code Request Capture"
echo "========================================"
echo ""
echo "Starting mitmproxy on port 8080..."
echo ""
echo "In ANOTHER terminal, run:"
echo "  export HTTPS_PROXY=http://localhost:8080"
echo "  claude -p \"your prompt here\""
echo ""
echo "Press 'q' to quit and save capture"
echo ""

# Find the latest capture file or create new one
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CAPTURE_FILE="captures/claude_requests_${TIMESTAMP}.mitm"

mkdir -p captures

# Start mitmproxy
"$MITM_EXE" \
  -p 8080 \
  --set flow_detail=3 \
  --set save_stream_file="$CAPTURE_FILE" \
  --set stream_large_bodies=1m \
  --set view_filter="~d api.anthropic.com"

echo ""
echo "Capture saved to: $CAPTURE_FILE"
echo ""
echo "To analyze:"
echo "  python scripts/analyze-capture.py $CAPTURE_FILE"
