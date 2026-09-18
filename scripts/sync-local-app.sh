#!/bin/sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="/Applications/Jcat.app"
LS="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

find_src() {
  if [ -d "$ROOT/dist/mac-arm64/Jcat.app" ]; then
    echo "$ROOT/dist/mac-arm64/Jcat.app"
  elif [ -d "$ROOT/dist/mac/Jcat.app" ]; then
    echo "$ROOT/dist/mac/Jcat.app"
  else
    find "$ROOT/dist" -type d -name 'Jcat.app' 2>/dev/null | head -n 1
  fi
}

SRC="$(find_src)"
if [ -z "${SRC:-}" ] || [ ! -d "$SRC" ]; then
  echo "missing unpacked Jcat.app under dist/ — build the mac app first" >&2
  exit 1
fi

osascript -e 'tell application "Jcat" to quit' >/dev/null 2>&1 || true
sleep 1
pkill -f '/Applications/Jcat.app/Contents/MacOS/Jcat' >/dev/null 2>&1 || true
pkill -f '/Users/michael/Projects/jcat/dist/.*/Jcat.app/Contents/MacOS/Jcat' >/dev/null 2>&1 || true
sleep 1

# Eject installer volumes so Spotlight does not list a third copy.
for vol in /Volumes/Jcat*; do
  [ -e "$vol" ] || continue
  hdiutil detach "$vol" -quiet 2>/dev/null || hdiutil detach "$vol" -force 2>/dev/null || true
done

rm -rf "$DEST"
cp -R "$SRC" "$DEST"

# Remove every unpackaged .app under dist. Keep dmg/exe only.
touch "$ROOT/dist/.metadata_never_index"
find "$ROOT/dist" -type d -name 'Jcat.app' -prune -print0 2>/dev/null | while IFS= read -r -d '' app; do
  "$LS" -u "$app" >/dev/null 2>&1 || true
  rm -rf "$app"
done

"$LS" -f "$DEST" >/dev/null 2>&1 || true
echo "installed $DEST"
