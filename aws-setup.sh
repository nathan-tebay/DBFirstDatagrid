#!/bin/sh
# aws-setup.sh - create the AWS resources for dbfirstdatagrid.tebay.dev.
#
# Usage:
#   ./aws-setup.sh [--dry-run]
#
# Environment/defaults are loaded from .envrc when present:
#   AWS_ACCOUNT_ID, AWS_REGION, DOMAIN, CERT_ARN, ECR_REPO, LAMBDA_FUNCTION,
#   LAMBDA_ROLE_NAME, LAMBDA_MEMORY, LAMBDA_TIMEOUT, LAMBDA_EPHEMERAL_STORAGE,
#   CF_DIST_ID, HOSTED_ZONE_ID

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/.envrc" ]; then
  # shellcheck disable=SC1091
  . "${SCRIPT_DIR}/.envrc"
fi

AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-158578456321}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DOMAIN="${DOMAIN:-dbfirstdatagrid.tebay.dev}"
CERT_ARN="${CERT_ARN:-}"
ECR_REPO="${ECR_REPO:-ntebay/dbfirstdatagrid}"
LAMBDA_FUNCTION="${LAMBDA_FUNCTION:-dbfirstdatagrid}"
LAMBDA_ROLE_NAME="${LAMBDA_ROLE_NAME:-dbfirstdatagrid-lambda}"
LAMBDA_MEMORY="${LAMBDA_MEMORY:-512}"
LAMBDA_TIMEOUT="${LAMBDA_TIMEOUT:-30}"
LAMBDA_EPHEMERAL_STORAGE="${LAMBDA_EPHEMERAL_STORAGE:-512}"
CF_DIST_ID="${CF_DIST_ID:-}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-}"
DRY_RUN=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) sed -n '1,18p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_REGISTRY}/${ECR_REPO}:latest"
LAMBDA_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${LAMBDA_ROLE_NAME}"
CLOUDFRONT_ZONE_ID="Z2FDTNDATAQYW2"

section() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
info()    { printf '    %s\n' "$*"; }
ok()      { printf '    \033[32m✓\033[0m %s\n' "$*"; }
warn()    { printf '    \033[33m!\033[0m %s\n' "$*"; }
err()     { printf '    \033[31m✗\033[0m %s\n' "$*"; exit 1; }

run() {
  if [ "$DRY_RUN" = "1" ]; then
    info "Would run: $*"
  else
    "$@"
  fi
}

ensure_ecr_repo() {
  section "1. ECR repository"
  if aws ecr describe-repositories --region "$AWS_REGION" --repository-names "$ECR_REPO" >/dev/null 2>&1; then
    ok "ECR repository exists: $ECR_REPO"
  else
    run aws ecr create-repository \
      --region "$AWS_REGION" \
      --repository-name "$ECR_REPO" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=AES256 >/dev/null
    ok "Created ECR repository: $ECR_REPO"
  fi
}

ensure_lambda_role() {
  section "2. Lambda execution role"
  if aws iam get-role --role-name "$LAMBDA_ROLE_NAME" >/dev/null 2>&1; then
    ok "IAM role exists: $LAMBDA_ROLE_NAME"
  else
    TRUST_FILE="$(mktemp)"
    cat > "$TRUST_FILE" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF
    run aws iam create-role \
      --role-name "$LAMBDA_ROLE_NAME" \
      --assume-role-policy-document "file://${TRUST_FILE}" \
      --description "Lambda role for dbfirstdatagrid.tebay.dev" >/dev/null
    rm -f "$TRUST_FILE"
    ok "Created IAM role: $LAMBDA_ROLE_NAME"
  fi

  run aws iam attach-role-policy \
    --role-name "$LAMBDA_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole >/dev/null
  ok "Attached AWSLambdaBasicExecutionRole"
}

image_exists() {
  aws ecr describe-images \
    --region "$AWS_REGION" \
    --repository-name "$ECR_REPO" \
    --image-ids imageTag=latest >/dev/null 2>&1
}

ensure_lambda_function() {
  section "3. Lambda function"
  if aws lambda get-function --region "$AWS_REGION" --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
    ok "Lambda function exists: $LAMBDA_FUNCTION"
    return
  fi

  if ! image_exists; then
    warn "No latest image exists in ECR yet."
    warn "Run ./deploy-aws.sh, then rerun ./aws-setup.sh to create CloudFront and DNS."
    return
  fi

  warn "Creating Lambda function from $IMAGE_URI"
  run aws lambda create-function \
    --region "$AWS_REGION" \
    --function-name "$LAMBDA_FUNCTION" \
    --package-type Image \
    --code "ImageUri=${IMAGE_URI}" \
    --role "$LAMBDA_ROLE_ARN" \
    --memory-size "$LAMBDA_MEMORY" \
    --timeout "$LAMBDA_TIMEOUT" \
    --ephemeral-storage "Size=${LAMBDA_EPHEMERAL_STORAGE}" >/dev/null
  ok "Created Lambda function: $LAMBDA_FUNCTION"
}

ensure_function_url() {
  section "4. Lambda function URL"
  if ! aws lambda get-function --region "$AWS_REGION" --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
    warn "Skipping function URL because Lambda function does not exist yet."
    return
  fi

  if aws lambda get-function-url-config --region "$AWS_REGION" --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
    ok "Function URL exists"
  else
    run aws lambda create-function-url-config \
      --region "$AWS_REGION" \
      --function-name "$LAMBDA_FUNCTION" \
      --auth-type NONE >/dev/null
    ok "Created public function URL"
  fi

  run aws lambda add-permission \
    --region "$AWS_REGION" \
    --function-name "$LAMBDA_FUNCTION" \
    --statement-id FunctionUrlAllowPublicInvoke \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE >/dev/null 2>&1 || true

  run aws lambda add-permission \
    --region "$AWS_REGION" \
    --function-name "$LAMBDA_FUNCTION" \
    --statement-id FunctionUrlAllowPublicInvokeFunction \
    --action lambda:InvokeFunction \
    --principal "*" \
    --invoked-via-function-url >/dev/null 2>&1 || true

  FUNCTION_URL="$(aws lambda get-function-url-config \
    --region "$AWS_REGION" \
    --function-name "$LAMBDA_FUNCTION" \
    --query FunctionUrl \
    --output text)"
  info "Function URL: $FUNCTION_URL"
}

ensure_cloudfront() {
  section "5. CloudFront"
  [ -n "$CERT_ARN" ] || { warn "CERT_ARN is empty; skipping CloudFront."; return; }
  if ! aws lambda get-function-url-config --region "$AWS_REGION" --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
    warn "Skipping CloudFront because function URL does not exist yet."
    return
  fi

  if [ -n "$CF_DIST_ID" ]; then
    ok "Using existing distribution: $CF_DIST_ID"
    CURRENT_ALIASES="$(aws cloudfront get-distribution \
      --id "$CF_DIST_ID" \
      --query 'Distribution.DistributionConfig.Aliases.Items' \
      --output text 2>/dev/null || true)"
    case " $CURRENT_ALIASES " in
      *" $DOMAIN "*) ok "CloudFront alias exists: $DOMAIN" ;;
      *)
        warn "CloudFront alias is not attached yet: $DOMAIN"
        if aws cloudfront associate-alias \
          --target-distribution-id "$CF_DIST_ID" \
          --alias "$DOMAIN" >/dev/null 2>&1; then
          ok "Attached CloudFront alias: $DOMAIN"
        else
          DIST_DOMAIN="$(aws cloudfront get-distribution \
            --id "$CF_DIST_ID" \
            --query 'Distribution.DomainName' \
            --output text 2>/dev/null || true)"
          warn "CloudFront could not attach the alias automatically."
          warn "Create DNS TXT _${DOMAIN} with value ${DIST_DOMAIN}, then rerun ./aws-setup.sh."
          warn "After the alias attaches, create/override DNS CNAME ${DOMAIN} -> ${DIST_DOMAIN} at Porkbun."
        fi
        ;;
    esac
    return
  fi

  FUNCTION_URL="$(aws lambda get-function-url-config \
    --region "$AWS_REGION" \
    --function-name "$LAMBDA_FUNCTION" \
    --query FunctionUrl \
    --output text)"
  ORIGIN_DOMAIN="$(printf '%s' "$FUNCTION_URL" | sed 's#^https://##; s#/$##')"
  CALLER_REFERENCE="${LAMBDA_FUNCTION}-$(date +%s)"
  CONFIG_FILE="$(mktemp)"

  cat > "$CONFIG_FILE" <<EOF
{
  "CallerReference": "${CALLER_REFERENCE}",
  "Comment": "${DOMAIN}",
  "Enabled": true,
  "Aliases": { "Quantity": 1, "Items": ["${DOMAIN}"] },
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "lambda-function-url",
      "DomainName": "${ORIGIN_DOMAIN}",
      "OriginPath": "",
      "CustomHeaders": { "Quantity": 0 },
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only",
        "OriginSslProtocols": { "Quantity": 1, "Items": ["TLSv1.2"] },
        "OriginReadTimeout": 30,
        "OriginKeepaliveTimeout": 5
      },
      "ConnectionAttempts": 3,
      "ConnectionTimeout": 10,
      "OriginShield": { "Enabled": false }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "lambda-function-url",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "Compress": true,
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
    "OriginRequestPolicyId": "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  },
  "CacheBehaviors": { "Quantity": 0 },
  "CustomErrorResponses": { "Quantity": 0 },
  "DefaultRootObject": "",
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "ACMCertificateArn": "${CERT_ARN}",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021",
    "Certificate": "${CERT_ARN}",
    "CertificateSource": "acm"
  },
  "Restrictions": {
    "GeoRestriction": { "RestrictionType": "none", "Quantity": 0 }
  },
  "HttpVersion": "http2",
  "IsIPV6Enabled": true
}
EOF

  if [ "$DRY_RUN" = "1" ]; then
    info "Would create CloudFront distribution for ${DOMAIN} -> ${ORIGIN_DOMAIN}"
  else
    NEW_DIST_ID="$(aws cloudfront create-distribution \
      --distribution-config "file://${CONFIG_FILE}" \
      --query 'Distribution.Id' \
      --output text)"
    ok "Created CloudFront distribution: $NEW_DIST_ID"
    warn "Set CF_DIST_ID=\"${NEW_DIST_ID}\" in .envrc after this run."
    CF_DIST_ID="$NEW_DIST_ID"
  fi
  rm -f "$CONFIG_FILE"
}

ensure_dns() {
  section "6. Route 53 DNS"
  [ -n "$CF_DIST_ID" ] || { warn "CF_DIST_ID is empty; skipping DNS."; return; }

  DIST_DOMAIN="$(aws cloudfront get-distribution \
    --id "$CF_DIST_ID" \
    --query 'Distribution.DomainName' \
    --output text 2>/dev/null || true)"
  [ -n "$DIST_DOMAIN" ] && [ "$DIST_DOMAIN" != "None" ] || { warn "CloudFront distribution domain not ready."; return; }

  if [ -z "$HOSTED_ZONE_ID" ]; then
    HOSTED_ZONE_ID="$(aws route53 list-hosted-zones-by-name \
      --dns-name tebay.dev \
      --query "HostedZones[?Name=='tebay.dev.'].Id | [0]" \
      --output text 2>/dev/null | sed 's#/hostedzone/##')"
  fi
  [ -n "$HOSTED_ZONE_ID" ] && [ "$HOSTED_ZONE_ID" != "None" ] || { warn "HOSTED_ZONE_ID not found; skipping DNS."; return; }

  CHANGE_FILE="$(mktemp)"
  cat > "$CHANGE_FILE" <<EOF
{
  "Comment": "Point ${DOMAIN} at CloudFront",
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${DOMAIN}",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "${CLOUDFRONT_ZONE_ID}",
        "DNSName": "${DIST_DOMAIN}",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF
  run aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "file://${CHANGE_FILE}" >/dev/null
  rm -f "$CHANGE_FILE"
  ok "Upserted DNS alias: ${DOMAIN} -> ${DIST_DOMAIN}"
}

section "dbfirstdatagrid AWS setup"
info "Account : $AWS_ACCOUNT_ID"
info "Region  : $AWS_REGION"
info "Domain  : $DOMAIN"
info "Image   : $IMAGE_URI"
[ "$DRY_RUN" = "1" ] && warn "Dry-run mode - no changes will be made"

ensure_ecr_repo
ensure_lambda_role
ensure_lambda_function
ensure_function_url
ensure_cloudfront
ensure_dns

section "Done"
