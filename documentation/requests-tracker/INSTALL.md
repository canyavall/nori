# Installation Guide for Windows

## Current Status

✅ mitmproxy installed (via pip)
⚠️ Not in PATH - need to add
❌ Certificate not installed yet

## Quick Installation (2 Steps - PowerShell)

### Step 1: Install Certificate (3 minutes)

**Automated PowerShell Script (Recommended)**:
```powershell
cd requests_tracker\scripts
.\install-certificate.ps1
```

**Git Bash Alternative**:
```bash
cd requests_tracker/scripts
./install-certificate.sh
```

**Manual Installation**:

1. **Generate certificate** (run in PowerShell or Git Bash):
   ```bash
   # Add to PATH first (temporary)
   $env:PATH="C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts;$env:PATH"

   # Run mitmproxy briefly (press Ctrl+C after it starts)
   mitmproxy
   ```

2. **Install certificate**:
   - Open File Explorer
   - Navigate to: `%USERPROFILE%\.mitmproxy\`
   - Double-click: `mitmproxy-ca-cert.p12`
   - Password: `mitmproxy`
   - Store Location: **Current User**
   - Place in: **Trusted Root Certification Authorities** (IMPORTANT!)
   - Click Finish

3. **Verify**:
   ```powershell
   certutil -user -verifystore Root mitmproxy
   ```

### Step 2: Test It Works (1 minute)

**PowerShell**:
```powershell
cd requests_tracker\scripts
.\test-capture.ps1
```

**Git Bash**:
```bash
cd requests_tracker/scripts
./test-capture.sh
```

If successful, you'll see:
- ✅ Request successful!
- ✅ Capture file created with size > 0 bytes

## Alternative: Use Full Paths (No PATH Setup Needed)

If you don't want to modify PATH:

**Start mitmproxy**:
```bash
cd requests_tracker
python scripts/start-capture.py
```

The Python script will use the full path automatically.

## Troubleshooting

### "mitmproxy not found"

**Problem**: Command not found after installation

**Solution**:
```powershell
# Use full path
& "C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\mitmproxy.exe"

# OR add to PATH (see Step 1 above)
```

### "Certificate not trusted"

**Problem**: SSL errors when using proxy

**Solution**:
1. Make sure certificate is in **Trusted Root Certification Authorities** (not "Personal")
2. Reinstall using the manual method above
3. Restart your terminal

### "Connection refused on localhost:8080"

**Problem**: Can't connect to proxy

**Solution**:
1. Make sure mitmproxy is running: `mitmproxy -p 8080`
2. Check if port is already in use: `netstat -an | findstr 8080`
3. Try a different port: `mitmproxy -p 8081`

## Next Steps

After installation:

1. **Read Quick Start**: `QUICK-START.md`
2. **Test capture**: `python scripts/start-capture.py`
3. **Capture Claude Code**: See `README.md`

## Files You Need

All scripts are ready in `requests_tracker/scripts/`:

**PowerShell Scripts** (recommended):
- ✅ `install-certificate.ps1` - Certificate installer (PowerShell)
- ✅ `test-capture.ps1` - Test capture (PowerShell)
- ✅ `quick-start.ps1` - Start capturing Claude Code (PowerShell)

**Git Bash Scripts**:
- ✅ `install-certificate.sh` - Certificate installer (Bash)
- ✅ `test-capture.sh` - Test capture (Bash)
- ✅ `quick-start.sh` - Start capturing Claude Code (Bash)

**Python Scripts** (cross-platform):
- ✅ `start-capture.py` - Main capture script
- ✅ `analyze-capture.py` - Analysis script
