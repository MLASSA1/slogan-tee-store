#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

# The bound is a guard against a hung build in CI, not a correctness
# requirement. GNU coreutils ships `timeout`; Homebrew installs it as
# `gtimeout`; macOS has neither out of the box. Rather than refuse to build on a
# developer machine, fall back to an unbounded build and say so.
timeout_bin=""
for candidate in timeout gtimeout; do
  if command -v "${candidate}" >/dev/null 2>&1; then
    timeout_bin="${candidate}"
    break
  fi
done

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run 'npm ci' and wait for it to finish before building." >&2
  exit 69
fi

if [[ -n "${timeout_bin}" ]]; then
  echo "Running bounded vinext build..."
  "${timeout_bin}" \
    --signal=TERM \
    --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
    "${SITES_BUILD_TIMEOUT:-3m}" \
    "${vinext}" build
else
  echo "Running vinext build (unbounded: no GNU timeout available)..."
  echo "  Install it with 'brew install coreutils' to bound the build." >&2
  "${vinext}" build
fi

"${script_dir}/validate-artifact.sh"
