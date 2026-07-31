#!/usr/bin/env bash
#
# update-dist.sh — build @rwh/keystrokes and publish the artifacts to a dist
# branch, so downstream projects can install the package directly from this
# GitHub fork via:
#
#   "@rwh/keystrokes": "github:scalableminds/Keystrokes#dist/keystrokes"
#
# Usage:
#   ./scripts/update-dist.sh [dist-branch]
#
#   ./scripts/update-dist.sh                            # publish to dist/keystrokes (release)
#   ./scripts/update-dist.sh dist/my-feature            # publish to a review branch
#   ALLOW_UNMERGED=1 ./scripts/update-dist.sh           # publish a release from a non-main branch
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
# RELEASE WORKFLOW:
#   1. Make your changes to packages/keystrokes/src/ on a feature branch.
#   2. Open a PR against main and get it reviewed.
#   3. After it merges, run this script from main.
#   4. In the downstream project run `yarn install` and commit the lockfile.
#
# REVIEW WORKFLOW (change not merged yet):
#   dist/keystrokes is what every consumer resolves, so publishing unreviewed
#   work there ships it to anyone who runs `yarn install`. Publish to a separate
#   dist branch instead and point the downstream PR at the commit this script
#   prints:
#
#     ./scripts/update-dist.sh dist/my-feature
#     # then in the downstream package.json, for the duration of the review:
#     #   "@rwh/keystrokes": "github:scalableminds/Keystrokes#<printed-sha>"
#
#   Pin the commit rather than the branch name: dist branches are force-pushed,
#   so a branch reference can change under a reviewer mid-review.
#
#   Once the source PR is merged, publish to dist/keystrokes as usual and point
#   the downstream project back at "#dist/keystrokes".
#
set -euo pipefail

DEFAULT_DIST_BRANCH="dist/keystrokes"
DIST_BRANCH="${1:-$DEFAULT_DIST_BRANCH}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
PKG_DIR="$REPO_ROOT/packages/keystrokes"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Guard against shipping unreviewed source to the branch all consumers resolve.
if [ "$DIST_BRANCH" = "$DEFAULT_DIST_BRANCH" ] &&
  [ "$CURRENT_BRANCH" != "main" ] &&
  [ "${ALLOW_UNMERGED:-0}" != "1" ]; then
  cat >&2 <<EOF
Refusing to publish $DEFAULT_DIST_BRANCH from '$CURRENT_BRANCH'.

Every consumer resolves $DEFAULT_DIST_BRANCH, so this would ship unreviewed
source. Either:

  * merge to main first, then re-run this script from main, or
  * publish a review build to its own branch:
        ./scripts/update-dist.sh dist/${CURRENT_BRANCH##*/}
  * or, if you really mean it:
        ALLOW_UNMERGED=1 ./scripts/update-dist.sh
EOF
  exit 1
fi

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
  echo "No changes to $DIST_BRANCH — nothing to commit."
  echo "Current commit: $(git rev-parse HEAD)"
else
  git commit -m "dist: update @rwh/keystrokes built artifacts (from $CURRENT_BRANCH)"
  git push origin "$DIST_BRANCH" --force-with-lease
  echo
  echo "Done — $DIST_BRANCH updated and pushed."
  echo
  echo "  commit: $(git rev-parse HEAD)"
  echo "  install downstream with:"
  echo "    \"@rwh/keystrokes\": \"github:scalableminds/Keystrokes#$(git rev-parse HEAD)\""
fi
