#!/usr/bin/env bash
# Wake a stopped sandbox and re-emit recipe JSON (pairing may change).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"
load_common

payload="$(cat)"
resource_id="$(lifecycle_resource_id "$payload")"
public_url="$(lifecycle_public_url "$payload")"
snap_id="$(lifecycle_snapshot_id "$payload")"
[ -n "$resource_id" ] || { log "No resource id in lifecycle payload"; exit 1; }
[ -n "$public_url" ] || { log "No publicUrl in lifecycle payload"; exit 1; }
[ -n "$snap_id" ] || snap_id="$snapshot_id"

pairing_ws="${public_url/https:\/\//wss://}"

# exec wakes a persistent sandbox if the previous session was stopped
"${VERCEL[@]}" sandbox exec "$resource_id" \
  "${VERCEL_ARGS[@]}" \
  --workdir "$workdir" \
  --timeout 30s \
  -- true >&2

"${VERCEL[@]}" sandbox copy \
  "${SCRIPT_DIR}/remote-start-serve.sh" \
  "${resource_id}:/tmp/remote-start-serve.sh" \
  "${VERCEL_ARGS[@]}" >&2

recipe_json="$("${VERCEL[@]}" sandbox exec "$resource_id" \
  "${VERCEL_ARGS[@]}" \
  --workdir "$workdir" \
  --timeout 60s \
  --env "ORCA_PORT=${port}" \
  --env "ORCA_PROJECT_ROOT=${project_root}" \
  --env "ORCA_PAIRING_ADDRESS=${pairing_ws}" \
  -- bash /tmp/remote-start-serve.sh)"

print_recipe_json "$recipe_json" "$resource_id" "$snap_id" "$public_url"
