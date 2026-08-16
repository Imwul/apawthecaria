#!/usr/bin/env bash
# Runs inside the Vercel sandbox. Refuse to snapshot unless grok is logged in.
# Grok has no login-status command; a populated ~/.grok/auth.json is written
# only after a successful device-auth / OAuth login.
set -euo pipefail

export PATH="${HOME}/.grok/bin:${HOME}/.local/bin:${PATH}"

auth="${HOME}/.grok/auth.json"
if [ ! -s "$auth" ]; then
  echo "grok is not logged in (missing ${auth}); not snapshotting" >&2
  exit 1
fi

node -e '
  const fs = require("fs");
  const path = process.argv[1];
  const data = JSON.parse(fs.readFileSync(path, "utf8"));
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    console.error("grok auth.json is empty; not snapshotting");
    process.exit(1);
  }
' "$auth"

if ! grok version >/dev/null 2>&1; then
  echo "grok binary failed after login; not snapshotting" >&2
  exit 1
fi

echo "grok auth file present and grok version ok" >&2
