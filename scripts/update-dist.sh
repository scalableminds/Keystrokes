#!/usr/bin/env bash
#
# update-dist.sh — build @rwh/keystrokes and publish the artifacts to the
# `dist/keystrokes` branch so downstream projects can install the package
# directly from this GitHub fork via:
#
#   "@rwh/keystrokes": "github:scalableminds/Keystrokes#dist/keystrokes"
#
# WHY a separate dist branch?
#   This repo is a pnpm monorepo. The root package.json belongs to the monorepo
#   itself ("@rwh/keystrokes-monorepo"), not to the keystrokes package. Yarn
#   (and npm) resolve git dependencies by looking for a package.json at the
#   repo root, so they cannot install a package from a subdirectory. We cannot
#   move the keystrokes package.json to the root without breaking pnpm tooling.
#
#   The dist branch is a pure build-artifact branch (like gh-pages for docs)
#   that holds only the files a consumer needs: package.json + dist/. It has
#   a flat structure with no monorepo overhead, so Yarn resolves it correctly.
#
# WORKFLOW:
#   1. Make your changes to packages/keystrokes/src/ on any source branch.
#   2. Run this script to rebuild and update the dist branch.
#   3. The downstream project just runs `yarn install` — no extra steps.
#
set -euo pipefail

DIST_BRANCH="dist/keystrokes"
REPO_ROOT="$(git rev-parse --show-toplevel)"
PKG_DIR="$REPO_ROOT/packages/keystrokes"

# Build the package from the source tree
echo "Building @rwh/keystrokes..."
cd "$PKG_DIR"
pnpm run build
cd "$REPO_ROOT"

# Use a temporary git worktree so we update the dist branch without switching
# away from whatever branch we're currently on.
TMPDIR="$(mktemp -d)"
trap 'git worktree remove --force "$TMPDIR" 2>/dev/null; rm -rf "$TMPDIR"' EXIT

if git show-ref --verify --quiet "refs/remotes/origin/$DIST_BRANCH"; then
  git fetch origin "$DIST_BRANCH"
  git worktree add "$TMPDIR" "origin/$DIST_BRANCH" -B "$DIST_BRANCH"
elif git show-ref --verify --quiet "refs/heads/$DIST_BRANCH"; then
  git worktree add "$TMPDIR" "$DIST_BRANCH"
else
  # First run: create the orphan dist branch from scratch
  git worktree add --orphan -b "$DIST_BRANCH" "$TMPDIR"
fi

# Replace all tracked files with the fresh build artifacts
cd "$TMPDIR"
git rm -rf . 2>/dev/null || true
cp "$PKG_DIR/package.json" .
cp "$PKG_DIR/readme.md" .
cp -r "$PKG_DIR/dist" .

git add -A
if git diff --cached --quiet; then
  echo "No changes to dist/keystrokes — nothing to commit."
else
  git commit -m "dist: update @rwh/keystrokes built artifacts"
  git push origin "$DIST_BRANCH" --force-with-lease
  echo "Done — $DIST_BRANCH updated and pushed."
fi
