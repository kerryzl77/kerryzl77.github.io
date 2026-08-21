#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the Academic Pages Jekyll site.
set -euo pipefail

cd "$(dirname "$0")/.."

# Ruby toolchain + native build deps (only when missing). Ubuntu 24.04 ships
# Ruby 3.2, matching the repo Dockerfile.
if ! command -v ruby >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends ruby-full build-essential zlib1g-dev
fi

# Bundler (installed system-wide once).
if ! command -v bundle >/dev/null 2>&1; then
  sudo gem install bundler
fi

# Install Ruby gems into a project-local path so no root access is needed and
# they persist with the workspace. Gemfile.lock is intentionally gitignored.
bundle config set --local path 'vendor/bundle'
bundle install

# Node deps power the JS asset tooling (npm run build:js / watch:js).
npm install
