#!/usr/bin/env bash
# Runs inside the Vercel sandbox as root. Installs OS packages Orca/Electron need.
set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
  echo "apt-get not available on this image; use vercel/sandbox/node:24 or ubuntu" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  file \
  git \
  jq \
  libasound2t64 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  libxss1 \
  libxtst6 \
  python3 \
  python3-pip \
  xvfb \
  zlib1g-dev \
  || apt-get install -y --no-install-recommends \
    ca-certificates curl file git jq \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 libgbm1 \
    libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 \
    libxfixes3 libxkbcommon0 libxrandr2 libxss1 libxtst6 \
    python3 python3-pip xvfb zlib1g-dev
