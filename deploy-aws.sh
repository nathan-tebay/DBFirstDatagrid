#!/bin/sh
# deploy-aws.sh - build, push, and deploy the Lambda container.
#
# Usage:
#   ./deploy-aws.sh [--tag latest] [--dry-run]

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/.envrc" ]; then
  # shellcheck disable=SC1091
  . "${SCRIPT_DIR}/.envrc"
fi

AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-158578456321}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="${ECR_REPO:-ntebay/dbfirstdatagrid}"
LAMBDA_FUNCTION="${LAMBDA_FUNCTION:-dbfirstdatagrid}"
LAMBDA_ROLE_NAME="${LAMBDA_ROLE_NAME:-dbfirstdatagrid-lambda}"
LAMBDA_MEMORY="${LAMBDA_MEMORY:-512}"
LAMBDA_TIMEOUT="${LAMBDA_TIMEOUT:-30}"
LAMBDA_EPHEMERAL_STORAGE="${LAMBDA_EPHEMERAL_STORAGE:-512}"
CF_DIST_ID="${CF_DIST_ID:-}"
IMAGE_TAG="latest"
DRY_RUN=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --tag) IMAGE_TAG="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) sed -n '1,8p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
LAMBDA_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${LAMBDA_ROLE_NAME}"

section() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
info()    { printf '    %s\n' "$*"; }
ok()      { printf '    \033[32m✓\033[0m %s\n' "$*"; }
warn()    { printf '    \033[33m!\033[0m %s\n' "$*"; }
err()     { printf '    \033[31m✗\033[0m %s\n' "$*"; exit 1; }

section "dbfirstdatagrid Lambda deploy"
info "Image    : $IMAGE_URI"
info "Function : $LAMBDA_FUNCTION"
[ "$DRY_RUN" = "1" ] && warn "Dry-run mode - no changes will be made"

section "1. ECR login"
if [ "$DRY_RUN" = "1" ]; then
  info "Would authenticate podman with $ECR_REGISTRY"
else
  aws ecr describe-repositories --region "$AWS_REGION" --repository-names "$ECR_REPO" >/dev/null 2>&1 ||
    aws ecr create-repository --region "$AWS_REGION" --repository-name "$ECR_REPO" >/dev/null

  aws ecr get-login-password --region "$AWS_REGION" |
    podman login --username AWS --password-stdin "$ECR_REGISTRY" >/dev/null
  ok "Authenticated with ECR"
fi

section "2. Build (linux/amd64)"
if [ "$DRY_RUN" = "1" ]; then
  info "Would build ${IMAGE_URI} with Dockerfile-prod"
else
  podman build \
    --no-cache \
    --platform linux/amd64 \
    -f "${SCRIPT_DIR}/Dockerfile-prod" \
    -t "$IMAGE_URI" \
    "$SCRIPT_DIR"
  ok "Built $IMAGE_URI"
fi

section "3. Push"
if [ "$DRY_RUN" = "1" ]; then
  info "Would push $IMAGE_URI"
else
  podman push "$IMAGE_URI"
  ok "Pushed $IMAGE_URI"
fi

ensure_function_url() {
  if aws lambda get-function-url-config --region "$AWS_REGION" --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
    :
  else
    aws lambda create-function-url-config \
      --region "$AWS_REGION" \
      --function-name "$LAMBDA_FUNCTION" \
      --auth-type NONE >/dev/null
  fi

  aws lambda add-permission \
    --region "$AWS_REGION" \
    --function-name "$LAMBDA_FUNCTION" \
    --statement-id FunctionUrlAllowPublicInvoke \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE >/dev/null 2>&1 || true

  aws lambda add-permission \
    --region "$AWS_REGION" \
    --function-name "$LAMBDA_FUNCTION" \
    --statement-id FunctionUrlAllowPublicInvokeFunction \
    --action lambda:InvokeFunction \
    --principal "*" \
    --invoked-via-function-url >/dev/null 2>&1 || true
}

section "4. Lambda"
if [ "$DRY_RUN" = "1" ]; then
  info "Would create or update $LAMBDA_FUNCTION to use $IMAGE_URI"
else
  if aws lambda get-function --region "$AWS_REGION" --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
    aws lambda update-function-code \
      --region "$AWS_REGION" \
      --function-name "$LAMBDA_FUNCTION" \
      --image-uri "$IMAGE_URI" >/dev/null
    ok "Triggered Lambda image update"
    aws lambda wait function-updated \
      --region "$AWS_REGION" \
      --function-name "$LAMBDA_FUNCTION"
  else
    aws lambda create-function \
      --region "$AWS_REGION" \
      --function-name "$LAMBDA_FUNCTION" \
      --package-type Image \
      --code "ImageUri=${IMAGE_URI}" \
      --role "$LAMBDA_ROLE_ARN" \
      --memory-size "$LAMBDA_MEMORY" \
      --timeout "$LAMBDA_TIMEOUT" \
      --ephemeral-storage "Size=${LAMBDA_EPHEMERAL_STORAGE}" >/dev/null
    ok "Created Lambda function"
    aws lambda wait function-active-v2 \
      --region "$AWS_REGION" \
      --function-name "$LAMBDA_FUNCTION"
  fi
  ok "Lambda is updated"

  ensure_function_url
  FUNCTION_URL="$(aws lambda get-function-url-config \
    --region "$AWS_REGION" \
    --function-name "$LAMBDA_FUNCTION" \
    --query FunctionUrl \
    --output text)"
  info "Function URL: $FUNCTION_URL"
fi

section "5. CloudFront invalidation"
if [ -n "$CF_DIST_ID" ]; then
  if [ "$DRY_RUN" = "1" ]; then
    info "Would invalidate /* on $CF_DIST_ID"
  else
    aws cloudfront create-invalidation \
      --distribution-id "$CF_DIST_ID" \
      --paths "/*" >/dev/null
    ok "Created CloudFront invalidation"
  fi
else
  warn "CF_DIST_ID is empty; skipping invalidation"
fi

section "Done"
