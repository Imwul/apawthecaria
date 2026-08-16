#!/usr/bin/env bash
# Runs inside the Vercel sandbox (Linux). Installs tools, clones the repo,
# installs dependencies, and smoke-checks grok + orca.
set -euo pipefail

ORCA_PROJECT_ROOT="${ORCA_PROJECT_ROOT:-${HOME}/apawthecaria}"
ORCA_REPO_URL="${ORCA_REPO_URL:?ORCA_REPO_URL is required}"
ORCA_REPO_REF="${ORCA_REPO_REF:-main}"
ORCA_VERSION="${ORCA_VERSION:-v1.4.183}"

log() { printf '%s\n' "$*" >&2; }

install_dir="${HOME}/.local"
orca_root="${HOME}/opt/orca"
mkdir -p "${install_dir}/bin" "$orca_root" "${HOME}/.grok/bin"
# vercel CLI exec/copy chdir here by default; missing dir returns HTTP 400.
mkdir -p /vercel/sandbox

if [ -n "${GH_TOKEN:-}" ]; then
  printf '%s\n' '#!/usr/bin/env bash' \
    'case "$1" in *Username*) echo x-access-token;; *Password*) echo "$GH_TOKEN";; esac' \
    > /tmp/askpass.sh
  chmod 700 /tmp/askpass.sh
  export GIT_ASKPASS=/tmp/askpass.sh
  export GIT_TERMINAL_PROMPT=0
fi

mkdir -p "$(dirname "$ORCA_PROJECT_ROOT")"
if [ ! -d "${ORCA_PROJECT_ROOT}/.git" ]; then
  git clone "$ORCA_REPO_URL" "$ORCA_PROJECT_ROOT"
fi
cd "$ORCA_PROJECT_ROOT"
git fetch origin "$ORCA_REPO_REF"
git checkout -B "$ORCA_REPO_REF" FETCH_HEAD
rm -f /tmp/askpass.sh

if [ ! -x "${HOME}/.grok/bin/grok" ]; then
  curl -fsSL https://x.ai/cli/install.sh | bash
fi
export PATH="${HOME}/.grok/bin:${install_dir}/bin:${PATH}"

case "$(uname -m)" in
  x86_64) orca_asset="orca-linux.AppImage" ;;
  aarch64|arm64) orca_asset="orca-linux-arm64.AppImage" ;;
  *) log "Unsupported architecture: $(uname -m)"; exit 1 ;;
esac

if [ ! -x "${orca_root}/squashfs-root/AppRun" ]; then
  curl -fL --retry 3 \
    "https://github.com/stablyai/orca/releases/download/${ORCA_VERSION}/${orca_asset}" \
    -o "${orca_root}/orca-linux.AppImage"
  chmod +x "${orca_root}/orca-linux.AppImage"
  (cd "$orca_root" && ./orca-linux.AppImage --appimage-extract)
fi
ln -sfn "${orca_root}/squashfs-root/AppRun" "${install_dir}/bin/orca"
printf '%s\n' "$ORCA_VERSION" > "${orca_root}/VERSION"

profile="${HOME}/.bashrc"
touch "$profile"
grep -q '.grok/bin' "$profile" || printf '\nexport PATH="$HOME/.grok/bin:$HOME/.local/bin:$PATH"\n' >> "$profile"
grep -q 'LIBGL_ALWAYS_SOFTWARE' "$profile" || printf 'export LIBGL_ALWAYS_SOFTWARE=1\n' >> "$profile"

cd "$ORCA_PROJECT_ROOT"
npm ci
npx tsc -b --pretty false
commit="$(git rev-parse HEAD)"
printf '%s' "$commit" > .orca-built

command -v git >/dev/null
command -v node >/dev/null
command -v npm >/dev/null
command -v python3 >/dev/null
command -v Xvfb >/dev/null
"${HOME}/.grok/bin/grok" version
[ -x "${install_dir}/bin/orca" ]
[ -x "${orca_root}/squashfs-root/orca-ide" ]
if ldd "${orca_root}/squashfs-root/orca-ide" | grep -q 'not found'; then
  ldd "${orca_root}/squashfs-root/orca-ide" >&2
  echo "orca-ide is missing shared libraries" >&2
  exit 1
fi

log "base setup complete at ${ORCA_PROJECT_ROOT} (${commit})"
printf 'DETECTED_PROJECT_ROOT=%s\n' "$ORCA_PROJECT_ROOT"
