#!/usr/bin/env bash

set -e

REPO="$1"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.prod"

if [ -z "$REPO" ]; then
  echo "Usage: ./set-secrets.sh owner/repo"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

gh auth status >/dev/null 2>&1 || { echo "Run: gh auth login"; exit 1; }

gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO" --body "$CLOUDFLARE_ACCOUNT_ID"
gh secret set CLOUDFLARE_API_TOKEN --repo "$REPO" --body "$CLOUDFLARE_API_TOKEN"
gh secret set CLOUDFLARE_PROJECT_NAME --repo "$REPO" --body "$CLOUDFLARE_PROJECT_NAME"
gh secret set CONVEX_DEPLOY_KEY --repo "$REPO" --body "$CONVEX_DEPLOY_KEY"
gh secret set VITE_CONVEX_SITE_URL --repo "$REPO" --body "$VITE_CONVEX_SITE_URL"
gh secret set VITE_CONVEX_URL --repo "$REPO" --body "$VITE_CONVEX_URL"
gh secret set VITE_VAPID_PUBLIC_KEY --repo "$REPO" --body "$VITE_VAPID_PUBLIC_KEY"

echo "Done for $REPO"