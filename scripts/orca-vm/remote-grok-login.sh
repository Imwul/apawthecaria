#!/usr/bin/env bash
# Runs inside the Vercel sandbox. Start grok device-auth (URL + code on host).
set -euo pipefail
export PATH="${HOME}/.grok/bin:${HOME}/.local/bin:${PATH}"
exec grok login --device-auth
