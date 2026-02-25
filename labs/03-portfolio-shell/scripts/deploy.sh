#!/usr/bin/env bash
set -euo pipefail

# Load .env.local if present
if [[ -f ".env.local" ]]; then
  set -a
  source .env.local
  set +a
fi

: "${AWS_PROFILE:?Missing AWS_PROFILE}"
: "${AWS_REGION:?Missing AWS_REGION}"
: "${BUCKET_NAME:?Missing BUCKET_NAME}"
: "${CF_DIST_ID:?Missing CF_DIST_ID}"

echo "== Deploying Lab 03 Portfolio Shell =="
echo "Profile: $AWS_PROFILE"
echo "Region:  $AWS_REGION"
echo "Bucket:  $BUCKET_NAME"
echo "CF Dist: $CF_DIST_ID"
echo

echo "1) Build"
npm run build

echo "2) Sync dist -> S3 (delete removed files)"
aws s3 sync dist/ "s3://$BUCKET_NAME" \
  --delete \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION"

echo "3) CloudFront invalidation"
aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" \
  --paths "/*" \
  --profile "$AWS_PROFILE"

echo
echo "Done."
