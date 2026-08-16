#!/usr/bin/env bash
# Phase 3: boot the base snapshot, run grok device-auth, re-snapshot.
# Interactive login cannot be driven by this agent — the user must run the
# printed exec command in their own terminal, then re-run this script with
# ORCA_VM_AUTH_LOGIN_DONE=1 after login finishes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"
load_common

[ -n "$snapshot_id" ] || { log "snapshotId missing — run scripts/orca-vm/vercel-base-snapshot.sh first"; exit 1; }
[ -n "$project" ] || { log "Vercel project missing — set VERCEL_PROJECT or edit ${STATE_FILE}"; exit 1; }

auth="$(sanitize_name "${base_name}-auth")"
source_snapshot="$snapshot_id"

cleanup_on_error() {
  if [ "${1:-$?}" -ne 0 ]; then
    log "auth snapshot failed; removing sandbox ${auth}"
    "${VERCEL[@]}" sandbox remove "$auth" "${VERCEL_ARGS[@]}" >/dev/null 2>&1 || true
  fi
}
trap 'cleanup_on_error $?' EXIT

if ! "${VERCEL[@]}" sandbox list --all "${VERCEL_ARGS[@]}" 2>/dev/null | grep -q "$auth"; then
  log "creating auth sandbox ${auth} from ${source_snapshot}"
  "${VERCEL[@]}" sandbox create \
    --name "$auth" \
    --snapshot "$source_snapshot" \
    --timeout "$timeout" \
    --publish-port "$port" \
    "${VERCEL_ARGS[@]}" >&2
else
  log "reusing existing auth sandbox ${auth}"
fi

if [ "${ORCA_VM_AUTH_LOGIN_DONE:-}" != "1" ]; then
  trap - EXIT
  cat >&2 <<EOF

Auth sandbox is up: ${auth}

This agent cannot drive the interactive login (no TTY). In your own terminal, run:

  ${VERCEL[*]} sandbox exec --interactive --tty --workdir ${workdir} ${VERCEL_ARGS[*]} ${auth} -- /vercel/.grok/bin/grok login --device-auth

Open the printed URL on this Mac, enter the code, then tell the agent that login finished
or re-run:

  ORCA_VM_AUTH_LOGIN_DONE=1 ${SCRIPT_DIR}/vercel-base-auth.sh

The sandbox is left running until that second step.

EOF
  exit 0
fi

log "verifying grok login"
"${VERCEL[@]}" sandbox copy \
  "${SCRIPT_DIR}/remote-verify-grok.sh" \
  "${auth}:/tmp/remote-verify-grok.sh" \
  "${VERCEL_ARGS[@]}" >&2
"${VERCEL[@]}" sandbox exec "$auth" \
  "${VERCEL_ARGS[@]}" \
  --workdir "$workdir" \
  --timeout 30s \
  -- bash /tmp/remote-verify-grok.sh >&2

log "snapshotting authenticated sandbox"
out="$("${VERCEL[@]}" sandbox snapshot "$auth" --stop --expiration 30d "${VERCEL_ARGS[@]}" 2>&1)"
printf '%s\n' "$out" >&2
new_id="$(parse_snapshot_id "$out")"
[ -n "$new_id" ] || { log "could not parse authenticated snapshot id"; exit 1; }

"${VERCEL[@]}" sandbox remove "$auth" "${VERCEL_ARGS[@]}" >&2 || true
trap - EXIT

merge_state "$(node -e '
  process.stdout.write(JSON.stringify({
    snapshotId: process.argv[1],
    authSourceSnapshotId: process.argv[2],
  }));
' "$new_id" "$source_snapshot")"
