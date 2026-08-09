#!/usr/bin/env bash
#
# Imports store photography into public/images/.
#
# Save each image into one folder using the simple names in the table below
# (any extension: .png, .jpg, .jpeg, .webp, .heic). This script converts each
# one to an optimised JPEG and writes it out under the filename the storefront
# actually references — which is deliberately not something you should have to
# remember, because the legacy "-solo" suffix means Bone for some products and
# Washed Ink Black for others.
#
# Everything is re-encoded well under 768 KiB. The original PNGs in this repo
# were truncated at exactly that boundary by whatever published it, which is why
# the product grid rendered as blank gradients.
#
# Usage:
#   bash scripts/prepare-images.sh ~/Desktop/slogan-images
#
# Uses sips and ImageIO, both built into macOS. No dependencies to install.

set -euo pipefail

source_dir="${1:-}"
if [[ -z "${source_dir}" || ! -d "${source_dir}" ]]; then
  echo "usage: bash scripts/prepare-images.sh <folder-with-your-images>" >&2
  exit 64
fi

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target_dir="${project_root}/public/images"
mkdir -p "${target_dir}"

# Largest edge, and the ceiling we re-compress against. 700 KiB leaves headroom
# under the 768 KiB limit that truncated the originals.
MAX_EDGE=1600
MAX_BYTES=$((700 * 1024))

# "<name you save>:<filename the storefront loads>"
MAPPING=(
  "just-kiss-bone:product-just-kiss-solo"
  "just-kiss-black:product-just-kiss-black"
  "break-bone:product-break-bone"
  "break-black:product-break-solo"
  "simple-bone:product-simple-solo"
  "simple-black:product-simple-black"
  "afraid-bone:product-afraid-bone"
  "afraid-black:product-afraid-solo"
  "date-them-bone:product-date-them-solo"
  "date-them-black:product-date-them-black"
  "marry-moroccan-bone:product-marry-moroccan-solo"
  "marry-moroccan-black:product-marry-moroccan-black"
  "hero:slogan-tee-hero"
  "size-guide:slogan-tee-size-guide"
  "review-casa:review-casa-anonymous"
  "review-rabat:review-rabat-anonymous"
)

find_source() {
  local stem="$1"
  for ext in png jpg jpeg JPG JPEG PNG webp WEBP heic HEIC; do
    if [[ -f "${source_dir}/${stem}.${ext}" ]]; then
      printf '%s' "${source_dir}/${stem}.${ext}"
      return 0
    fi
  done
  return 1
}

# Steps quality down until the file fits, so a busy photo is not left oversized.
encode() {
  local src="$1" dest="$2"
  for quality in 80 70 60 50 40; do
    sips --setProperty format jpeg \
         --setProperty formatOptions "${quality}" \
         --resampleHeightWidthMax "${MAX_EDGE}" \
         "${src}" --out "${dest}" >/dev/null 2>&1
    local size
    size=$(stat -f%z "${dest}")
    if (( size <= MAX_BYTES )); then
      # Trailing newline matters: without it `read` sees EOF, returns
      # non-zero, and `set -e` aborts the script on macOS bash 3.2.
      printf '%s %s\n' "${size}" "${quality}"
      return 0
    fi
  done
  printf '%s %s\n' "$(stat -f%z "${dest}")" "40"
}

written=0
# A plain string, not an array: bash 3.2 with `set -u` errors when an empty
# array is expanded, and macOS still ships bash 3.2.
missing=""

for entry in "${MAPPING[@]}"; do
  stem="${entry%%:*}"
  target="${entry##*:}"

  if ! src="$(find_source "${stem}")"; then
    missing="${missing}${stem} "
    continue
  fi

  dest="${target_dir}/${target}.jpg"
  read -r size quality < <(encode "${src}" "${dest}")
  printf '  %-34s -> %-38s %6s KB  q%s\n' \
    "$(basename "${src}")" "$(basename "${dest}")" "$((size / 1024))" "${quality}"
  written=$((written + 1))
done

echo
echo "Wrote ${written} image(s) to public/images/"

if [[ -n "${missing}" ]]; then
  echo
  echo "Not found in ${source_dir} (skipped):"
  for stem in ${missing}; do
    echo "  ${stem}"
  done
fi

echo
echo "Next: run 'bash scripts/verify-images.sh' to confirm every file decodes,"
echo "then ask Claude to point app/store-data.ts at the .jpg filenames."
