#!/usr/bin/env bash
# Per-workspace create: boot the authenticated snapshot, start orca serve,
# print one recipe-result JSON object to stdout.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"
load_common

[ -n "$snapshot_id" ] || { log "snapshotId missing — run Phases 2–3 first (vercel-base-snapshot.sh, then vercel-base-auth.sh)"; exit 1; }
[ -n "$project" ] || { log "Vercel project missing — set VERCEL_PROJECT or edit ${STATE_FILE}"; exit 1; }

token="$(gh_token)"
name="$(sanitize_name "orca-${ORCA_VM_RECIPE_ID:-vercel-sandbox}-${ORCA_VM_INSTANCE_ID:-$(date +%s)}")"

cleanup_on_error() {
  if [ "${1:-$?}" -ne 0 ]; then
    log "create failed; removing sandbox ${name}"
    "${VERCEL[@]}" sandbox remove "$name" "${VERCEL_ARGS[@]}" >/dev/null 2>&1 || true
  fi
}
trap 'cleanup_on_error $?' EXIT

create_output="$("${VERCEL[@]}" sandbox create \
  --name "$name" \
  --snapshot "$snapshot_id" \
  --timeout "$timeout" \
  --publish-port "$port" \
  "${VERCEL_ARGS[@]}" 2>&1)"
printf '%s\n' "$create_output" >&2

public_url="$(parse_public_url "$create_output")"
[ -n "$public_url" ] || { log "no published URL in create output"; exit 1; }
pairing_ws="${public_url/https:\/\//wss://}"

sync_env=(
  --env "GH_TOKEN=${token}"
  --env "ORCA_PROJECT_ROOT=${project_root}"
  --env "ORCA_REPO_URL=${repo_url}"
  --env "ORCA_REPO_REF=${repo_ref}"
)
"${VERCEL[@]}" sandbox copy \
  "${SCRIPT_DIR}/remote-sync-repo.sh" \
  "${name}:/tmp/remote-sync-repo.sh" \
  "${VERCEL_ARGS[@]}" >&2
"${VERCEL[@]}" sandbox exec "$name" \
  "${VERCEL_ARGS[@]}" \
  --workdir "$workdir" \
  --timeout 20m \
  "${sync_env[@]}" \
  -- bash /tmp/remote-sync-repo.sh >&2

"${VERCEL[@]}" sandbox copy \
  "${SCRIPT_DIR}/remote-start-serve.sh" \
  "${name}:/tmp/remote-start-serve.sh" \
  "${VERCEL_ARGS[@]}" >&2

recipe_json="$("${VERCEL[@]}" sandbox exec "$name" \
  "${VERCEL_ARGS[@]}" \
  --workdir "$workdir" \
  --timeout 60s \
  --env "ORCA_PORT=${port}" \
  --env "ORCA_PROJECT_ROOT=${project_root}" \
  --env "ORCA_PAIRING_ADDRESS=${pairing_ws}" \
  -- bash /tmp/remote-start-serve.sh)"

print_recipe_json "$recipe_json" "$name" "$snapshot_id" "$public_url"
trap - EXIT
