#!/usr/bin/env bash
# Runs inside the Vercel sandbox. Starts orca serve and prints recipe JSON
# to stdout once it is parseable.
set -euo pipefail

ORCA_PORT="${ORCA_PORT:?ORCA_PORT is required}"
ORCA_PROJECT_ROOT="${ORCA_PROJECT_ROOT:?ORCA_PROJECT_ROOT is required}"
ORCA_PAIRING_ADDRESS="${ORCA_PAIRING_ADDRESS:?ORCA_PAIRING_ADDRESS is required}"

export PATH="${HOME}/.grok/bin:${HOME}/.local/bin:${PATH}"
export LIBGL_ALWAYS_SOFTWARE=1

if [ -z "${DISPLAY:-}" ]; then
  if ! pgrep -x Xvfb >/dev/null 2>&1; then
    Xvfb :99 -screen 0 1280x1024x24 -nolisten tcp >/tmp/xvfb.log 2>&1 &
    sleep 0.5
  fi
  export DISPLAY=:99
fi

orca_bin="${HOME}/.local/bin/orca"
if [ ! -x "$orca_bin" ]; then
  orca_bin="${HOME}/opt/orca/squashfs-root/AppRun"
fi
[ -x "$orca_bin" ] || { echo "orca binary not found" >&2; exit 1; }
[ -d "$ORCA_PROJECT_ROOT" ] || { echo "project root missing: $ORCA_PROJECT_ROOT" >&2; exit 1; }

rm -f /tmp/orca-recipe.json /tmp/orca-serve.log
nohup "$orca_bin" serve \
  --port "$ORCA_PORT" \
  --project-root "$ORCA_PROJECT_ROOT" \
  --pairing-address "$ORCA_PAIRING_ADDRESS" \
  --recipe-json \
  >/tmp/orca-recipe.json 2>/tmp/orca-serve.log </dev/null &
pid=$!

for _ in $(seq 1 80); do
  if node -e 'JSON.parse(require("node:fs").readFileSync("/tmp/orca-recipe.json","utf8"))' >/dev/null 2>&1; then
    cat /tmp/orca-recipe.json
    exit 0
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    cat /tmp/orca-serve.log >&2
    echo "orca serve exited before emitting recipe JSON" >&2
    exit 1
  fi
  sleep 0.25
done

cat /tmp/orca-serve.log >&2
echo "serve recipe JSON timed out" >&2
exit 1
