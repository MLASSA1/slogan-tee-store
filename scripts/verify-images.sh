#!/usr/bin/env bash
#
# Checks that every image the storefront references exists and decodes fully.
#
# The originals in this repo were truncated at exactly 768 KiB, which browsers
# render as a partial image fading into nothing rather than a broken-image icon
# — so a visual glance at the site is not a reliable check. This is.
#
#   bash scripts/verify-images.sh

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${project_root}"

python3 - <<'PY'
import glob
import os
import re
import struct
import sys

REFERENCED = set()
for path in glob.glob("app/**/*.ts", recursive=True) + glob.glob("app/**/*.tsx", recursive=True):
    with open(path, encoding="utf-8") as handle:
        REFERENCED.update(re.findall(r"/images/[A-Za-z0-9._/-]+", handle.read()))

def inspect(path):
    """Returns (ok, detail) for a file on disk."""
    if not os.path.isfile(path):
        return False, "MISSING"

    size = os.path.getsize(path)
    with open(path, "rb") as handle:
        data = handle.read()

    if data[:8] == b"\x89PNG\r\n\x1a\n":
        offset = 8
        while offset + 8 <= len(data):
            length = struct.unpack(">I", data[offset:offset + 4])[0]
            kind = data[offset + 4:offset + 8]
            if offset + 12 + length > len(data):
                return False, f"TRUNCATED in {kind.decode('latin1', 'replace')} chunk"
            offset += 12 + length
            if kind == b"IEND":
                return True, f"ok, {size // 1024} KB"
        return False, "TRUNCATED (no IEND)"

    if data[:2] == b"\xff\xd8":
        if data[-2:] != b"\xff\xd9":
            return False, "TRUNCATED (no end-of-image marker)"
        return True, f"ok, {size // 1024} KB"

    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        expected = struct.unpack("<I", data[4:8])[0] + 8
        if len(data) < expected:
            return False, f"TRUNCATED ({len(data)} of {expected} bytes)"
        return True, f"ok, {size // 1024} KB"

    # SVG is XML, so a truncated file fails to parse rather than half-rendering.
    head = data[:400].lstrip()
    if head.startswith(b"<?xml") or head.startswith(b"<svg"):
        try:
            import xml.etree.ElementTree as ElementTree

            root = ElementTree.fromstring(data.decode("utf-8"))
        except Exception as error:  # noqa: BLE001 - report any parse failure
            return False, f"MALFORMED SVG ({type(error).__name__})"
        if not root.tag.endswith("svg"):
            return False, "NOT AN SVG ROOT ELEMENT"
        return True, f"ok, {size // 1024} KB (placeholder artwork)"

    return False, "UNRECOGNISED FORMAT"

failures = 0
for reference in sorted(REFERENCED):
    path = "public" + reference
    ok, detail = inspect(path)
    if not ok:
        failures += 1
    print(f"  {'PASS' if ok else 'FAIL'}  {reference:<44} {detail}")

print()
if failures:
    print(f"{failures} image(s) need attention.")
    sys.exit(1)

print(f"All {len(REFERENCED)} referenced images decode cleanly.")
PY
