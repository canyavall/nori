#!/bin/bash
# mitmproxy Certificate Installation for Git Bash on Windows

MITM_EXE="/c/Users/canya/AppData/Local/Packages/PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0/LocalCache/local-packages/Python313/Scripts/mitmproxy.exe"
CERT_DIR="$HOME/.mitmproxy"

echo "========================================"
echo "mitmproxy Certificate Installation"
echo "========================================"
echo ""
echo "Step 1: Generate certificate..."
echo "This will start mitmproxy briefly."
echo "Press Ctrl+C after a few seconds."
echo ""
read -p "Press ENTER to continue..."

# Start mitmproxy to generate certificate
"$MITM_EXE" &
MITM_PID=$!

echo ""
echo "mitmproxy is running (PID: $MITM_PID)"
echo "Press Ctrl+C to stop it after you see the interface..."

# Wait for user to stop it
wait $MITM_PID 2>/dev/null || true

echo ""
echo "Step 2: Certificate generated!"
echo "Location: $CERT_DIR/mitmproxy-ca-cert.p12"
echo ""
echo "Step 3: Install the certificate"
echo "========================================"
echo ""
echo "Opening certificate folder..."
explorer "$CERT_DIR"
echo ""
echo "MANUAL INSTALLATION:"
echo "  1. Double-click: mitmproxy-ca-cert.p12"
echo "  2. Password: mitmproxy"
echo "  3. Store Location: Current User"
echo "  4. Place in: Trusted Root Certification Authorities"
echo "  5. Click Finish"
echo ""
echo "After installation, verify with:"
echo "  certutil -user -verifystore Root mitmproxy"
echo ""
read -p "Press ENTER when done..."
