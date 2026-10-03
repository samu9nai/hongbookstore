#!/usr/bin/env bash
set -euo pipefail

# Cloud Run deploy helper for HongBookStore
# - Builds container image with Cloud Build
# - Deploys to Cloud Run with cost-safe defaults (min=0, max=1)
# - Optional Secret Manager integration (--use-secrets, --bootstrap-secrets)
#
# Usage:
#   PROJECT_ID=your-project REGION=us-west1 REPO=containers \
#   ./deploy/cloudrun/deploy.sh \
#     [--allow-unauthenticated] \
#     [--env-file path/.env] \
#     [--use-secrets] [--secrets-file deploy/cloudrun/secrets.list] \
#     [--bootstrap-secrets] [--service-account sa@your-project.iam.gserviceaccount.com]

PROJECT_ID=${PROJECT_ID:-}
REGION=${REGION:-us-west1}
REPO=${REPO:-containers}
SERVICE_NAME=${SERVICE_NAME:-hongbookstore}
ALLOW_UNAUTH=false
ENV_FILE=""
USE_SECRETS=false
SECRETS_FILE="deploy/cloudrun/secrets.list"
BOOTSTRAP_SECRETS=false
SERVICE_ACCOUNT=${SERVICE_ACCOUNT:-}

usage() {
  cat <<'USAGE'
Usage: PROJECT_ID=... REGION=... REPO=... ./deploy/cloudrun/deploy.sh [flags]

Flags:
  --allow-unauthenticated     Make the service publicly accessible
  --env-file <path>           Load non-secret env vars from file
  --use-secrets               Map secrets listed in secrets.list
  --secrets-file <path>       Override secrets list path
  --bootstrap-secrets         Create/update Secret Manager entries
  --service-account <email>   Deploy with custom runtime service account
  -h, --help                  Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-unauthenticated) ALLOW_UNAUTH=true; shift ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --use-secrets) USE_SECRETS=true; shift ;;
    --secrets-file) SECRETS_FILE="$2"; shift 2 ;;
    --bootstrap-secrets) BOOTSTRAP_SECRETS=true; shift ;;
    --service-account) SERVICE_ACCOUNT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "[warn] unknown arg: $1"; shift ;;
  esac
done

if [[ -z "${PROJECT_ID}" ]]; then
  echo "[error] Set PROJECT_ID env var or pass via env." >&2
  exit 1
fi

command -v gcloud >/dev/null || { echo "[error] gcloud not found"; exit 1; }

TAG=$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE_NAME}:${TAG}"

echo "[build] Submitting image: ${IMAGE_URI}"
SUBMIT_OUTPUT=$(mktemp)
if ! gcloud builds submit --project "${PROJECT_ID}" --tag "${IMAGE_URI}" backend --async >"${SUBMIT_OUTPUT}" 2>&1; then
  cat "${SUBMIT_OUTPUT}" >&2
  rm -f "${SUBMIT_OUTPUT}"
  echo "[error] Failed to submit Cloud Build." >&2
  exit 1
fi

cat "${SUBMIT_OUTPUT}"
BUILD_ID=$(sed -n 's/.*builds\/\([[:alnum:]-]\+\).*/\1/p' "${SUBMIT_OUTPUT}" | tail -n1)
rm -f "${SUBMIT_OUTPUT}"

if [[ -z "${BUILD_ID}" ]]; then
  echo "[error] Could not determine build ID from submission output." >&2
  exit 1
fi

echo "[build] Submitted Cloud Build ID: ${BUILD_ID}"

while true; do
  STATUS=$(gcloud builds describe "${BUILD_ID}" --project "${PROJECT_ID}" --format='value(status)')
  echo "[build] Build status: ${STATUS}"
  case "${STATUS}" in
    SUCCESS)
      break
    ;;
    QUEUED|WORKING)
      sleep 10
      ;;
    *)
      echo "[error] Cloud Build finished with status ${STATUS}." >&2
      echo "[hint] Check build logs in Cloud Console: https://console.cloud.google.com/cloud-build/builds/${BUILD_ID}?project=${PROJECT_ID}" >&2
      exit 1
      ;;
  esac
done

FLAGS=(
  --project "${PROJECT_ID}"
  --region "${REGION}"
  --image "${IMAGE_URI}"
  --platform managed
  --port 8080
  --concurrency 80
  --min-instances 0
  --max-instances 1
  --cpu 1
  --memory 2Gi
  --set-env-vars SPRING_PROFILES_ACTIVE=prod
)

[[ -n "${SERVICE_ACCOUNT}" ]] && FLAGS+=(--service-account "${SERVICE_ACCOUNT}")
[[ "${ALLOW_UNAUTH}" == "true" ]] && FLAGS+=(--allow-unauthenticated)

# Load secrets list (if used) into an associative set
declare -A SECRET_KEYS
if [[ "${USE_SECRETS}" == "true" ]]; then
  if [[ ! -f "${SECRETS_FILE}" ]]; then
    echo "[error] --use-secrets enabled but secrets file not found: ${SECRETS_FILE}" >&2
    exit 1
  fi
  echo "[secrets] Mapping secrets from ${SECRETS_FILE}"
  while IFS= read -r RAW; do
    [[ -z "${RAW}" || "${RAW}" =~ ^# ]] && continue
    NAME=${RAW%%=*}
    SECRET_ID=${RAW#*=}
    NAME=$(echo "${NAME}" | xargs)
    SECRET_ID=$(echo "${SECRET_ID}" | xargs)
    if [[ -z "${SECRET_ID}" || "${NAME}" == "${SECRET_ID}" ]]; then
      SECRET_ID="${NAME}"
    fi
    SECRET_KEYS["${NAME}"]=1
    FLAGS+=(--set-secrets "${NAME}=projects/${PROJECT_ID}/secrets/${SECRET_ID}:latest")
  done < "${SECRETS_FILE}"

  # Ensure required Artifact Analysis Pub/Sub topics exist
  gcloud services enable containeranalysis.googleapis.com --project "${PROJECT_ID}" >/dev/null
  for topic in container-analysis-notes-v1 container-analysis-occurrences-v1; do
    gcloud pubsub topics create projects/${PROJECT_ID}/topics/${topic} \
      --project "${PROJECT_ID}" >/dev/null 2>&1 || echo "[info] ${topic} topic already present"
  done
fi

# Optionally add non-secret env vars from file (excluding secret keys)
if [[ -n "${ENV_FILE}" ]]; then
  if [[ ! -f "${ENV_FILE}" ]]; then
    echo "[error] --env-file ${ENV_FILE} not found" >&2
    exit 1
  fi
  MAP_LIST=()
  while IFS='=' read -r KEY VALUE; do
    [[ -z "${KEY}" || "${KEY}" =~ ^# || -z "${VALUE}" ]] && continue
    if [[ -z "${SECRET_KEYS[$KEY]:-}" ]]; then
      MAP_LIST+=("${KEY}=${VALUE}")
    fi
  done < "${ENV_FILE}"
  if [[ ${#MAP_LIST[@]} -gt 0 ]]; then
    ENV_JOINED=$(printf "%s," "${MAP_LIST[@]}" | sed 's/,$//')
    FLAGS+=(--set-env-vars "${ENV_JOINED}")
  fi
fi

# Optionally create/update secrets from ENV_FILE
if [[ "${BOOTSTRAP_SECRETS}" == "true" ]]; then
  if [[ -z "${ENV_FILE}" ]]; then
    echo "[error] --bootstrap-secrets requires --env-file path/to/.env" >&2
    exit 1
  fi
  echo "[secrets] Bootstrapping secrets from ${ENV_FILE}"
  gcloud services enable secretmanager.googleapis.com --project "${PROJECT_ID}" >/dev/null 2>&1 || true
  if [[ -n "${SERVICE_ACCOUNT}" ]]; then
    echo "[iam] Grant roles/secretmanager.secretAccessor to ${SERVICE_ACCOUNT}"
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member "serviceAccount:${SERVICE_ACCOUNT}" \
      --role roles/secretmanager.secretAccessor >/dev/null
  fi
  while IFS= read -r NAME; do
    [[ -z "${NAME}" || "${NAME}" =~ ^# ]] && continue
    VALUE=$(grep -E "^${NAME}=" -m1 "${ENV_FILE}" | sed -E "s/^${NAME}=//")
    if [[ -z "${VALUE}" ]]; then
      echo "[warn] ${NAME} not found in ${ENV_FILE}; skipping"
      continue
    fi
    if ! gcloud secrets describe "${NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
      echo "[create] secret ${NAME}"
      gcloud secrets create "${NAME}" --project "${PROJECT_ID}" --replication-policy=automatic >/dev/null
    fi
    echo "[version] add ${NAME}:latest"
    printf "%s" "${VALUE}" | gcloud secrets versions add "${NAME}" --project "${PROJECT_ID}" --data-file=- >/dev/null
  done < "${SECRETS_FILE}"
fi

echo "[deploy] Deploying service: ${SERVICE_NAME}"
gcloud run deploy "${SERVICE_NAME}" "${FLAGS[@]}"

echo "[done] Service '${SERVICE_NAME}' deployed."
