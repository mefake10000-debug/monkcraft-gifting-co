#!/usr/bin/env bash
# Stage a deployable copy (real catalogue media, not out-of-tree symlink)
# and push production to Vercel team monkcraft1.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MEDIA="${MONKCRAFT_MEDIA:-$ROOT/public/catalogue-media}"
STAGING="${MONKCRAFT_STAGING:-/private/tmp/monkcraft-vercel-prod}"
SCOPE="${VERCEL_SCOPE:-monkcraft1}"

if [[ ! -d "$MEDIA/products" ]]; then
  echo "Catalogue media not found at: $MEDIA" >&2
  echo "Set MONKCRAFT_MEDIA to the website-export/media directory." >&2
  exit 1
fi

echo "Staging → $STAGING"
rm -rf "$STAGING"
mkdir -p "$STAGING"
rsync -a \
  --exclude '.git' \
  --exclude '.next' \
  --exclude 'node_modules' \
  --exclude 'tmp' \
  --exclude 'tmp-audit' \
  --exclude 'agent-transcripts' \
  --exclude 'docs/audits' \
  --exclude 'docs/image-overhaul' \
  --exclude 'docs/brand-film' \
  --exclude 'docs/design-references' \
  --exclude 'public/videos/**/preprod' \
  --exclude 'public/brand/illustration-concepts' \
  --exclude 'public/catalogue-media' \
  "$ROOT/" "$STAGING/"

mkdir -p "$STAGING/public/catalogue-media"
rsync -a "$MEDIA/" "$STAGING/public/catalogue-media/"
mkdir -p "$STAGING/.vercel"
cp "$ROOT/.vercel/project.json" "$STAGING/.vercel/project.json"

echo "Deploying production (archive) to scope ${SCOPE}…"
cd "$STAGING"
vercel deploy --prod --yes --archive=tgz --scope "$SCOPE"
