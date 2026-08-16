#!/usr/bin/env bash
# Phase 2: provision a Vercel sandbox, install tools + clone + build, snapshot.
# Run by hand (not via orca.yaml). Creates paid cloud resources.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"
load_common

[ -n "$repo_url" ] || { log "repoUrl missing — set ORCA_VM_REPO_URL or edit ${STATE_FILE}"; exit 1; }
[ -n "$project" ] || { log "Vercel project missing — set VERCEL_PROJECT or edit ${STATE_FILE}"; exit 1; }

token="$(gh_token)"
base="$(sanitize_name "$base_name")"

cleanup_on_error() {
  if [ "${1:-$?}" -ne 0 ]; then
    log "base snapshot failed; removing sandbox ${base}"
    "${VERCEL[@]}" sandbox remove "$base" "${VERCEL_ARGS[@]}" >/dev/null 2>&1 || true
  fi
}
trap 'cleanup_on_error $?' EXIT

log "creating base sandbox ${base} (image ${sandbox_image}, ${vcpus} vCPU, timeout ${timeout})"
"${VERCEL[@]}" sandbox create \
  --name "$base" \
  --image "$sandbox_image" \
  --timeout "$timeout" \
  --vcpus "$vcpus" \
  --publish-port "$port" \
  --snapshot-expiration 30d \
  --keep-last-snapshots 2 \
  "${VERCEL_ARGS[@]}" >&2

log "installing OS packages"
"${VERCEL[@]}" sandbox copy \
  "${SCRIPT_DIR}/remote-apt.sh" \
  "${base}:/tmp/remote-apt.sh" \
  "${VERCEL_ARGS[@]}" >&2
"${VERCEL[@]}" sandbox exec "$base" \
  "${VERCEL_ARGS[@]}" \
  --workdir "$workdir" \
  --timeout 10m \
  --sudo \
  -- bash /tmp/remote-apt.sh >&2

log "copying remote setup script"
"${VERCEL[@]}" sandbox copy \
  "${SCRIPT_DIR}/remote-base-setup.sh" \
  "${base}:/tmp/remote-base-setup.sh" \
  "${VERCEL_ARGS[@]}" >&2

log "installing tools, cloning repo, building"
# Leave ORCA_PROJECT_ROOT unset on first build so the sandbox uses $HOME/apawthecaria.
exec_env=(--env "ORCA_REPO_URL=${repo_url}" --env "ORCA_REPO_REF=${repo_ref}" --env "ORCA_VERSION=${orca_version}")
if [ -n "$token" ]; then
  exec_env+=(--env "GH_TOKEN=${token}")
fi
set +e
setup_out="$("${VERCEL[@]}" sandbox exec "$base" \
  "${VERCEL_ARGS[@]}" \
  --workdir "$workdir" \
  --timeout 25m \
  "${exec_env[@]}" \
  -- bash /tmp/remote-base-setup.sh 2>&1)"
setup_rc=$?
set -e
printf '%s\n' "$setup_out" >&2
if [ "$setup_rc" -ne 0 ]; then
  log "remote setup exited ${setup_rc}"
  exit 1
fi
if printf '%s\n' "$setup_out" | grep -Eqi 'error while loading|cannot open shared object|apt-get not available'; then
  log "remote setup reported a fatal error; not snapshotting"
  exit 1
fi
detected="$(printf '%s\n' "$setup_out" | sed -n 's/^DETECTED_PROJECT_ROOT=//p' | tail -1)"
[ -n "$detected" ] || { log "remote setup did not report DETECTED_PROJECT_ROOT"; exit 1; }
project_root="$detected"

log "snapshotting stopped sandbox"
out="$("${VERCEL[@]}" sandbox snapshot "$base" --stop --expiration 30d "${VERCEL_ARGS[@]}" 2>&1)"
printf '%s\n' "$out" >&2
snapshot_id="$(parse_snapshot_id "$out")"
[ -n "$snapshot_id" ] || { log "could not parse snapshot id from snapshot output"; exit 1; }

"${VERCEL[@]}" sandbox remove "$base" "${VERCEL_ARGS[@]}" >&2 || true
trap - EXIT

merge_state "$(node -e '
  const data = {
    baseName: process.argv[1],
    snapshotId: process.argv[2],
    projectRoot: process.argv[3],
    repoUrl: process.argv[4],
    repoRef: process.argv[5],
    port: Number(process.argv[6]),
    scope: process.argv[7],
    project: process.argv[8],
    orcaVersion: process.argv[9],
    sandboxImage: process.argv[10],
  };
  process.stdout.write(JSON.stringify(data));
' "$base" "$snapshot_id" "$project_root" "$repo_url" "$repo_ref" "$port" "$scope" "$project" "$orca_version" "$sandbox_image")"
