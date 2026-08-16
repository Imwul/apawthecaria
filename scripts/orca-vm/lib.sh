#!/usr/bin/env bash
# Shared helpers for local-side Vercel Sandbox recipes.
# Resolve: env var → state file → built-in fallback.

ORCA_VM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="${ORCA_VM_STATE_FILE:-$ORCA_VM_DIR/vercel-state.json}"

log() { printf '%s\n' "$*" >&2; }

json_get() {
  local key="$1"
  node -e '
    const fs = require("fs");
    const key = process.argv[1];
    const path = process.argv[2];
    let data = {};
    try { data = JSON.parse(fs.readFileSync(path, "utf8")); } catch {}
    const value = data[key];
    process.stdout.write(value == null ? "" : String(value));
  ' "$key" "$STATE_FILE"
}

# env_or_state ENV_NAME stateKey [fallback]
env_or_state() {
  local env_name="$1"
  local key="$2"
  local fallback="${3-}"
  local from_env=""
  if [ -n "${env_name}" ]; then
    from_env="${!env_name-}"
  fi
  if [ -n "${from_env}" ]; then
    printf '%s' "$from_env"
    return
  fi
  local from_state
  from_state="$(json_get "$key")"
  if [ -n "$from_state" ]; then
    printf '%s' "$from_state"
    return
  fi
  printf '%s' "$fallback"
}

merge_state() {
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const patch = JSON.parse(process.argv[2]);
    let data = {};
    try { data = JSON.parse(fs.readFileSync(path, "utf8")); } catch {}
    Object.assign(data, patch);
    const out = JSON.stringify(data, null, 2) + "\n";
    fs.writeFileSync(path, out);
    process.stdout.write(out);
  ' "$STATE_FILE" "$1"
}

resolve_vercel() {
  if command -v vercel >/dev/null 2>&1; then
    VERCEL=(vercel)
  else
    VERCEL=(npx --yes vercel)
  fi
}

load_common() {
  resolve_vercel
  base_name="$(env_or_state ORCA_VM_BASE_NAME baseName orca-base)"
  snapshot_id="$(env_or_state ORCA_VM_SNAPSHOT_ID snapshotId "")"
  scope="$(env_or_state VERCEL_SCOPE scope "")"
  project="$(env_or_state VERCEL_PROJECT project "")"
  port="$(env_or_state ORCA_VM_PORT port 7331)"
  timeout="$(env_or_state ORCA_VM_TIMEOUT timeout 30m)"
  vcpus="$(env_or_state ORCA_VM_VCPUS vcpus 2)"
  repo_url="$(env_or_state ORCA_VM_REPO_URL repoUrl "")"
  repo_ref="$(env_or_state ORCA_VM_REPO_REF repoRef main)"
  project_root="$(env_or_state ORCA_VM_PROJECT_ROOT projectRoot /home/vercel/apawthecaria)"
  orca_version="$(env_or_state ORCA_VM_ORCA_VERSION orcaVersion v1.4.183)"
  sandbox_image="$(env_or_state ORCA_VM_SANDBOX_IMAGE sandboxImage vercel/sandbox/node:24)"
  # vercel sandbox exec defaults to chdir /vercel/sandbox; this image uses $HOME=/vercel.
  workdir="$(env_or_state ORCA_VM_WORKDIR workdir /vercel)"
  VERCEL_ARGS=()
  [ -n "$scope" ] && VERCEL_ARGS+=(--scope "$scope")
  [ -n "$project" ] && VERCEL_ARGS+=(--project "$project")
}

gh_token() {
  if [ -n "${GH_TOKEN-}" ]; then
    printf '%s' "$GH_TOKEN"
    return
  fi
  if [ -n "${GITHUB_TOKEN-}" ]; then
    printf '%s' "$GITHUB_TOKEN"
    return
  fi
  if command -v gh >/dev/null 2>&1; then
    gh auth token 2>/dev/null || true
  fi
}

sanitize_name() {
  local raw="$1"
  local name
  name="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+//; s/-+$//')"
  printf '%s' "${name:0:63}"
}

parse_snapshot_id() {
  printf '%s\n' "$1" | sed -nE 's/.*(snap_[A-Za-z0-9]+).*/\1/p' | tail -1
}

parse_public_url() {
  printf '%s\n' "$1" | sed -nE 's#.*(https://[^[:space:]]+\.vercel\.run).*#\1#p' | head -1
}

lifecycle_resource_id() {
  local payload="$1"
  node -e '
    const data = JSON.parse(process.argv[1]);
    const result = data.recipeResult || data;
    const id = result.userData && result.userData.resourceId;
    process.stdout.write(id == null ? "" : String(id));
  ' "$payload"
}

lifecycle_public_url() {
  local payload="$1"
  node -e '
    const data = JSON.parse(process.argv[1]);
    const result = data.recipeResult || data;
    const url = result.userData && result.userData.publicUrl;
    process.stdout.write(url == null ? "" : String(url));
  ' "$payload"
}

lifecycle_snapshot_id() {
  local payload="$1"
  node -e '
    const data = JSON.parse(process.argv[1]);
    const result = data.recipeResult || data;
    const id = result.userData && result.userData.snapshotId;
    process.stdout.write(id == null ? "" : String(id));
  ' "$payload"
}

print_recipe_json() {
  local serve_json="$1"
  local resource_id="$2"
  local snap_id="$3"
  local public_url="$4"
  node -e '
    const serve = JSON.parse(process.argv[1]);
    const out = {
      ...serve,
      schemaVersion: 1,
      userData: {
        ...(serve.userData || {}),
        provider: "vercel-sandbox",
        resourceId: process.argv[2],
        snapshotId: process.argv[3],
        publicUrl: process.argv[4],
      },
    };
    process.stdout.write(JSON.stringify(out) + "\n");
  ' "$serve_json" "$resource_id" "$snap_id" "$public_url"
}
