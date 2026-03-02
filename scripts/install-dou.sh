#! /bin/sh
set -eu

PROJECT_DIR="$(cd "$(dirname "$0")/.." >/dev/null 2>&1 && pwd)"
BIN_DIR="${HOME}/.local/bin"
TARGET="${BIN_DIR}/dou"

mkdir -p "$BIN_DIR"
ln -sf "$PROJECT_DIR/dou.sh" "$TARGET"
chmod +x "$PROJECT_DIR/dou.sh"

echo "Installed: $TARGET -> $PROJECT_DIR/dou.sh"

case ":$PATH:" in
  *":$BIN_DIR:"*)
    echo "PATH already contains $BIN_DIR"
    ;;
  *)
    echo "Add this to your shell profile (~/.zshrc):"
    echo "  export PATH=\"$BIN_DIR:\$PATH\""
    ;;
esac

echo "Try:"
echo "  dou --help"
