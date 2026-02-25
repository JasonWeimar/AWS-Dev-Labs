#!/usr/bin/env bash
set -euo pipefail

if [[ -f ".env.local" ]]; then
  set -a
  source .env.local
  set +a
fi

: "${AWS_PROFILE:?Missing AWS_PROFILE}"
: "${CF_DIST_ID:?Missing CF_DIST_ID}"

aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" \
  --paths "/*" \
  --profile "$AWS_PROFILE"
