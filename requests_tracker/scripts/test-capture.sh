#!/bin/bash
# Quick test to verify mitmproxy captures HTTPS traffic

MITM_EXE="/c/Users/canya/AppData/Local/Packages/PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0/LocalCache/local-packages/Python313/Scripts/mitmdump.exe"

echo "========================================"
echo "Testing mitmproxy Capture"
echo "========================================"
echo ""
echo "This test will:"
echo "  1. Start mitmproxy in background"
echo "  2. Make a test HTTPS request"
echo "  3. Check if request was captured"
echo ""

CAPTURE_FILE="../captures/test_capture_$(date +%Y%m%d_%H%M%S).mitm"
mkdir -p ../captures

echo "Starting mitmproxy on port 8080..."
"$MITM_EXE" \
  -p 8080 \
  --set save_stream_file="$CAPTURE_FILE" \
  --quiet &

MITM_PID=$!
echo "mitmproxy started (PID: $MITM_PID)"

# Give it time to start
sleep 3

echo ""
echo "Sending test HTTPS request through proxy..."
echo "URL: https://httpbin.org/get"
echo ""

# Test with curl
RESPONSE=$(curl -s -x http://localhost:8080 https://httpbin.org/get 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Request successful!"
    echo "Response preview:"
    echo "$RESPONSE" | head -5
else
    echo "❌ Request failed!"
    echo "Error: $RESPONSE"
fi

echo ""
echo "Stopping mitmproxy..."
kill $MITM_PID 2>/dev/null
wait $MITM_PID 2>/dev/null || true

sleep 2

echo ""
echo "========================================"
echo "Checking capture file..."
echo "========================================"

if [ -f "$CAPTURE_FILE" ]; then
    SIZE=$(stat -f%z "$CAPTURE_FILE" 2>/dev/null || stat -c%s "$CAPTURE_FILE" 2>/dev/null || wc -c < "$CAPTURE_FILE")

    if [ "$SIZE" -gt 0 ]; then
        echo "✅ Capture file created: $(basename $CAPTURE_FILE)"
        echo "   Size: $SIZE bytes"
        echo ""
        echo "SUCCESS! mitmproxy is capturing traffic correctly."
        echo ""
        echo "Next steps:"
        echo "  1. Run: python ../scripts/analyze-capture.py $CAPTURE_FILE"
        echo "  2. Check: ../analysis/ folder for results"
    else
        echo "⚠️ Capture file is empty"
        echo "This might mean mitmproxy started but didn't capture anything"
    fi
else
    echo "❌ No capture file created"
    echo "This means mitmproxy didn't start properly"
fi

echo ""
echo "If the test failed, check:"
echo "  1. Certificate installed? (see install-certificate.sh)"
echo "  2. Port 8080 available? (netstat -an | grep 8080)"
echo "  3. Firewall blocking mitmproxy?"
