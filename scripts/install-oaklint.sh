#!/usr/bin/env bash
# NOTE: oaklint ships from a private GitHub release, not npm, so it installs
#       separately from `npm ci`. This pulls the latest release tarball with the
#       local `gh` auth and installs it without touching package.json or the lock.
set -euo pipefail

repo="omaralikhn/oaklint-ts"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

gh release download -R "$repo" -p '*.tgz' --dir "$tmp" --clobber
npm install --no-save "$tmp"/eslint-plugin-oaklint-*.tgz
