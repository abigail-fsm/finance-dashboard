#!/usr/bin/env bash
# Idempotent helper: ensures the standard FSM finance dashboard bucket exists and
# has CORS + encryption + public-access block. CloudFront + bucket policy are
# already created in AWS (see header in .github/workflows/deploy.yaml).
#
# To recreate the CloudFront distribution from scratch, use cloudfront-distribution-config.json
# (update CallerReference) and re-apply s3-bucket-policy.json after the new distribution ID exists.
# Custom domain finance.fullsend.management: ACM certificate must live in us-east-1 (CloudFront requirement);
# Route 53 A/AAAA alias targets the *.cloudfront.net domain (HostedZoneId Z2FDTNDATAQYW2).

set -euo pipefail

REGION="${AWS_REGION:-us-west-2}"
BUCKET="${FINANCE_DASHBOARD_BUCKET_NAME:-fsm-finance-dashboard-297063078864}"

if ! aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
  echo "Creating s3://${BUCKET} in ${REGION}..."
  aws s3api create-bucket \
    --bucket "${BUCKET}" \
    --region "${REGION}" \
    --create-bucket-configuration "LocationConstraint=${REGION}"
fi

aws s3api put-public-access-block --bucket "${BUCKET}" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-cors --bucket "${BUCKET}" --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag", "Content-Type", "Content-Length", "x-amz-server-side-encryption"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

aws s3api put-bucket-encryption --bucket "${BUCKET}" --server-side-encryption-configuration '{
  "Rules": [{ "ApplyServerSideEncryptionByDefault": { "SSEAlgorithm": "AES256" } }]
}'

echo "OK: s3://${BUCKET}/ (CORS + encryption + access block)"
