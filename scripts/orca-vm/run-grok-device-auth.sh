#!/usr/bin/env bash
# Local-side helper: open an interactive TTY into the auth sandbox and run
# grok device-auth. Intended to be run in a real terminal, not by this agent.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"
load_common

auth="$(sanitize_name "${base_name}-auth")"

# vercel sandbox exec drops shell quotes around `bash -lc '...'`, so copy a
# script and invoke it by path instead.
"${VERCEL[@]}" sandbox copy \
  "${SCRIPT_DIR}/remote-grok-login.sh" \
  "${auth}:/tmp/remote-grok-login.sh" \
  "${VERCEL_ARGS[@]}"

exec "${VERCEL[@]}" sandbox exec \
  --interactive \
  --tty \
  --workdir "$workdir" \
  "${VERCEL_ARGS[@]}" \
  "$auth" \
  -- bash /tmp/remote-grok-login.sh
