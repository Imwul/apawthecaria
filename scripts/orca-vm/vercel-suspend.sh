#!/usr/bin/env bash
# Sleep a per-workspace sandbox. Reads lifecycle JSON on stdin.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"
load_common

payload="$(cat)"
resource_id="$(lifecycle_resource_id "$payload")"
[ -n "$resource_id" ] || { log "No resource id in lifecycle payload"; exit 1; }

"${VERCEL[@]}" sandbox stop "$resource_id" "${VERCEL_ARGS[@]}" >&2
