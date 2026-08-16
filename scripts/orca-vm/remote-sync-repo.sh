#!/usr/bin/env bash
# Runs inside the Vercel sandbox. Fetches the desired ref and reinstalls
# only when HEAD changed since the last cached build.
set -euo pipefail

ORCA_PROJECT_ROOT="${ORCA_PROJECT_ROOT:?ORCA_PROJECT_ROOT is required}"
ORCA_REPO_URL="${ORCA_REPO_URL:?ORCA_REPO_URL is required}"
ORCA_REPO_REF="${ORCA_REPO_REF:-main}"

if [ -n "${GH_TOKEN:-}" ]; then
  printf '%s\n' '#!/usr/bin/env bash' \
    'case "$1" in *Username*) echo x-access-token;; *Password*) echo "$GH_TOKEN";; esac' \
    > /tmp/askpass.sh
  chmod 700 /tmp/askpass.sh
  export GIT_ASKPASS=/tmp/askpass.sh
  export GIT_TERMINAL_PROMPT=0
fi

if [ ! -d "${ORCA_PROJECT_ROOT}/.git" ]; then
  mkdir -p "$(dirname "$ORCA_PROJECT_ROOT")"
  git clone "$ORCA_REPO_URL" "$ORCA_PROJECT_ROOT"
fi

cd "$ORCA_PROJECT_ROOT"
git fetch origin "$ORCA_REPO_REF"
git checkout -B "$ORCA_REPO_REF" FETCH_HEAD
rm -f /tmp/askpass.sh

commit="$(git rev-parse HEAD)"
if [ -f .orca-built ] && [ "$(cat .orca-built)" = "$commit" ]; then
  printf 'repo already built at %s\n' "$commit" >&2
  exit 0
fi

npm ci
npx tsc -b --pretty false
printf '%s' "$commit" > .orca-built
printf 'rebuilt %s\n' "$commit" >&2
