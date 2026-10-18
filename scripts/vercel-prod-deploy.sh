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
  --exclude '.cursor' \
  --exclude '.next' \
  --exclude 'node_modules' \
  --exclude '.env*' \
  --exclude 'tmp' \
  --exclude 'tmp-audit' \
  --exclude 'agent-transcripts' \
  --exclude 'docs' \
  --exclude 'tests' \
  --exclude 'src/data/catalogue/export/internal-provenance.json' \
  --exclude 'src/data/catalogue/export/gifting-research.md' \
  --exclude 'src/data/catalogue/export/gifting-web-search-audit.csv' \
  --exclude 'public/videos/**/preprod' \
  --exclude 'public/brand/illustration-concepts' \
  --exclude 'public/catalogue-media' \
  "$ROOT/" "$STAGING/"

# Runtime uses only these five catalogue exports. Keep research, audits,
# supplier provenance, review CSVs, and precomputed editorials in the repo.
EXPORT_DIR="$STAGING/src/data/catalogue/export"
find "$EXPORT_DIR" -mindepth 1 -maxdepth 1 \
  ! -name 'products.json' \
  ! -name 'gifting-segments.json' \
  ! -name 'categories.json' \
  ! -name 'brands.json' \
  ! -name 'taxonomy.json' \
  -exec rm -rf -- {} +

mkdir -p "$STAGING/public/catalogue-media"
rsync -a "$MEDIA/" "$STAGING/public/catalogue-media/"
for INTERNAL_FILE in \
  "$STAGING/src/data/catalogue/export/internal-provenance.json" \
  "$STAGING/src/data/catalogue/export/gifting-research.md" \
  "$STAGING/src/data/catalogue/export/gifting-web-search-audit.csv"; do
  if [[ -e "$INTERNAL_FILE" ]]; then
    echo "Internal research file leaked into deployment staging: $INTERNAL_FILE" >&2
    exit 1
  fi
done
if [[ -e "$STAGING/docs" || -e "$STAGING/tests" ]]; then
  echo "Repository-only docs/tests leaked into deployment staging." >&2
  exit 1
fi
if find "$EXPORT_DIR" -mindepth 1 -maxdepth 1 \
  ! -name 'products.json' \
  ! -name 'gifting-segments.json' \
  ! -name 'categories.json' \
  ! -name 'brands.json' \
  ! -name 'taxonomy.json' | grep -q .; then
  echo "Non-runtime catalogue exports leaked into deployment staging." >&2
  exit 1
fi
mkdir -p "$STAGING/.vercel"
cp "$ROOT/.vercel/project.json" "$STAGING/.vercel/project.json"

echo "Deploying production (archive) to scope ${SCOPE}…"
cd "$STAGING"
vercel deploy --prod --yes --archive=tgz --scope "$SCOPE"
