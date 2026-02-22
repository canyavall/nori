#!/usr/bin/env bash
set -euo pipefail

# Build the Nori server as a standalone Bun binary sidecar for Tauri.
# Outputs to packages/app/src-tauri/binaries/nori-server-<target-triple>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(cd "$SERVER_DIR/../.." && pwd)"
OUT_DIR="$REPO_ROOT/packages/app/src-tauri/binaries"

mkdir -p "$OUT_DIR"

# Detect target triple (must match what Tauri expects)
detect_target() {
  local arch os

  arch="$(uname -m)"
  case "$arch" in
    x86_64)  arch="x86_64" ;;
    aarch64|arm64) arch="aarch64" ;;
    *)
      echo "Unsupported architecture: $arch" >&2
      exit 1
      ;;
  esac

  os="$(uname -s)"
  case "$os" in
    Darwin)  os="apple-darwin" ;;
    Linux)   os="unknown-linux-gnu" ;;
    MINGW*|MSYS*|CYGWIN*) os="pc-windows-msvc" ;;
    *)
      echo "Unsupported OS: $os" >&2
      exit 1
      ;;
  esac

  echo "${arch}-${os}"
}

# Allow overriding the target triple via environment
TARGET="${SIDECAR_TARGET:-$(detect_target)}"
OUTFILE="$OUT_DIR/nori-server-${TARGET}"

# On Windows, append .exe
case "$TARGET" in
  *windows*) OUTFILE="${OUTFILE}.exe" ;;
esac

echo "Building nori-server sidecar..."
echo "  Entry: $SERVER_DIR/src/index.ts"
echo "  Target: $TARGET"
echo "  Output: $OUTFILE"

# Note: sql.js WASM is embedded automatically by bun build --compile.
# If WASM loading fails at runtime, try: --external sql.js and ship the
# sql-wasm.wasm file alongside the binary.
bun build "$SERVER_DIR/src/index.ts" \
  --compile \
  --minify \
  --outfile "$OUTFILE"

chmod +x "$OUTFILE"

echo "Sidecar built successfully: $OUTFILE"
echo "  Size: $(du -h "$OUTFILE" | cut -f1)"
